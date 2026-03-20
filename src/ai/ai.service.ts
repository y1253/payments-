import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export type CategoryForAi = {
  category_id: number;
  category: string;
};

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly textModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'Missing OPENAI_API_KEY in environment variables',
      );
    }

    // Chat model used to select a category_id.
    this.textModel = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.2';

    this.openai = new OpenAI({ apiKey });
  }

  private safeJsonParse<T>(text: string): T | null {
    const jsonText = text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) return null;
    try {
      return JSON.parse(jsonText) as T;
    } catch {
      return null;
    }
  }

  /**
   * Choose which user category this `itemText` belongs to.
   * - Input: user's categories array [{category_id, category}, ...]
   * - Output: category_id (must be one of the provided ones)
   */
  async assignCategoryId(
    itemText: string,
    categories: CategoryForAi[],
  ): Promise<number> {
    const trimmedItem = (itemText ?? '').trim();
    if (!trimmedItem) throw new BadRequestException('itemText cannot be empty');
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new BadRequestException('categories cannot be empty');
    }

    const cleaned = categories
      .filter((c) => c && typeof c.category_id === 'number' && (c.category ?? '').trim().length > 0)
      .map((c) => ({ category_id: c.category_id, category: (c.category ?? '').trim() }));

    if (cleaned.length === 0) throw new BadRequestException('categories are invalid');

    const fallbackCategoryId = cleaned[0].category_id;

    const result = await this.openai.chat.completions.create({
      model: this.textModel,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You assign an item to exactly one category. Return ONLY valid JSON: { "category_id": number }. The number MUST be one of the provided category_id values.',
        },
        {
          role: 'user',
          content: [
            `Item: "${trimmedItem}"`,
            `User categories (choose the closest meaning):`,
            JSON.stringify(cleaned),
            `Return JSON only.`,
          ].join('\n'),
        },
      ],
    });

    const content = result.choices?.[0]?.message?.content ?? '';
    const parsed = this.safeJsonParse<{ category_id?: unknown }>(content);

    const candidate = parsed?.category_id;
    if (typeof candidate === 'number' && cleaned.some((c) => c.category_id === candidate)) {
      return candidate;
    }

    // Fallback if the model output is invalid.
    return fallbackCategoryId;
  }
}

