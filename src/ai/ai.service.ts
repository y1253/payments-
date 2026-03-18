import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export type ItemTypeCandidate = {
  item_types_id: number;
  // This should contain the "summarized text" you want to match against
  // (example: "vanilla ice cream").
  item: string;
  // In your DB entity this is called `type_id`. You want output `type`:
  // 1 = personal, 2 = buissness.
  type_id?: number;
  type?: 1 | 2;
};

export type NewSummary = { item: string; type: 1 | 2 };
export type AssigningResult = number | NewSummary;

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly embeddingModel: string;
  private readonly textModel: string;
  private readonly matchThreshold: number;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'Missing OPENAI_API_KEY in environment variables',
      );
    }

    this.embeddingModel =
      process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

    // Model used to "summarize / correct" item names when no match is found.
    this.textModel = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.2';

    // Cosine similarity threshold for matching against `item` embeddings.
    // Tune this based on your data.
    this.matchThreshold = parseFloat(
      process.env.OPENAI_MATCH_THRESHOLD ?? '0.82',
    );

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Embeds a single piece of text using `text-embedding-3-small`.
   * Returns the embedding vector (float array).
   */
  async embedText(text: string): Promise<number[]> {
    const input = (text ?? '').trim();
    if (!input) throw new BadRequestException('Text cannot be empty');

    const result = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input,
    });

    return result.data[0].embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new BadRequestException('Embedding vectors must have same length');
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    // Avoid division by zero
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  private candidateTypeToOutputType(
    c: ItemTypeCandidate,
  ): 1 | 2 {
    if (c.type === 1 || c.type === 2) return c.type;
    if (c.type_id === 1) return 1;
    if (c.type_id === 2) return 2;
    // Default if missing/unknown
    return 1;
  }

  /**
   * If no match exists, GPT will "summarize / normalize" the input into the
   * proper item name, and classify it into type: 1 (personal) or 2 (buissness).
   */
  async normalize(item: string, fallbackType: 1 | 2 = 1): Promise<NewSummary> {
    const itemTrimmed = (item ?? '').trim();
    if (!itemTrimmed) throw new BadRequestException('Input cannot be empty');

    const result = await this.openai.chat.completions.create({
      model: this.textModel,
      temperature: 0.2,
      messages: [
        {
          role: 'developer',
          content:
            'You normalize item/product names. Return ONLY valid JSON with keys { "item": string, "type": 1|2 }.',
        },
        {
          role: 'user',
          content: [
            `Input item: "${itemTrimmed}"`,
            `Rules:`,
            `- "item" must be a cleaned/corrected canonical name derived from the input (fix typos, merge obvious variations).`,
            `- "type" must be 1 for personal and 2 for buissness.`,
            `- Decide "type" using keywords like: Inc, LLC, Ltd, Corporation, Company, Store, Restaurant, Brand, Market.`,
            `- If unsure, use the fallbackType=${fallbackType}.`,
            `Return JSON only.`,
          ].join('\n'),
        },
      ],
    });

    const content = result.choices?.[0]?.message?.content ?? '';
    const jsonText = content.match(/\{[\s\S]*\}/)?.[0];

    if (!jsonText) {
      return { item: itemTrimmed, type: fallbackType };
    }

    try {
      const parsed = JSON.parse(jsonText) as { item?: unknown; type?: unknown };
      const normalizedItem =
        typeof parsed.item === 'string' && parsed.item.trim()
          ? parsed.item.trim()
          : itemTrimmed;

      const normalizedType =
        parsed.type === 2 || parsed.type === 1 ? (parsed.type as 1 | 2) : fallbackType;

      return { item: normalizedItem, type: normalizedType };
    } catch {
      return { item: itemTrimmed, type: fallbackType };
    }
  }

  /**
   * Main function requested:
   * - Input: `itemTypes` array (each has summarized `item` + `item_types_id` + type_id/type)
   * - Input: user `item`
   * - If match: returns `item_types_id`
   * - Else: returns new summarized object: { item: 'proper item name', type: 1|2 }
   */
  async assigning(itemTypes: ItemTypeCandidate[], item: string): Promise<AssigningResult> {
    if (!Array.isArray(itemTypes) || itemTypes.length === 0) {
      throw new BadRequestException('itemTypes cannot be empty');
    }

    const itemsToCompare = itemTypes.filter((c) => (c.item ?? '').trim().length > 0);
    if (itemsToCompare.length === 0) {
      // Nothing to compare against; must summarize/classify.
      return this.normalize(item, 1);
    }

    const inputEmbedding = await this.embedText(item);

    let bestScore = -Infinity;
    let bestCandidate: ItemTypeCandidate | null = null;

    // Simple baseline: embed each candidate and compare cosine similarity.
    // You can optimize later by caching candidate embeddings.
    for (const c of itemsToCompare) {
      const candidateEmbedding = await this.embedText(c.item);
      const score = this.cosineSimilarity(inputEmbedding, candidateEmbedding);

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = c;
      }
    }

    const matched = bestCandidate && bestScore >= this.matchThreshold;
    if (matched && bestCandidate) {
      return bestCandidate.item_types_id;
    }

    const fallbackType = bestCandidate
      ? this.candidateTypeToOutputType(bestCandidate)
      : 1;

    return this.normalize(item, fallbackType);
  }
}

