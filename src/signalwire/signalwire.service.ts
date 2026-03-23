import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SignalwireService {
  private readonly projectId: string;
  private readonly apiToken: string;
  private readonly spaceUrl: string;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    this.projectId = this.configService.get<string>('SIGNALWIRE_PROJECT_ID') ?? '';
    this.apiToken = this.configService.get<string>('SIGNALWIRE_API_TOKEN') ?? '';
    this.spaceUrl = this.configService.get<string>('SIGNALWIRE_SPACE_URL') ?? '';
    this.fromNumber = this.configService.get<string>('SIGNALWIRE_PHONE_NUMBER') ?? '';
  }

  private assertSignalWireConfigured(): void {
    const missing: string[] = [];
    if (!this.projectId.trim()) missing.push('SIGNALWIRE_PROJECT_ID');
    if (!this.apiToken.trim()) missing.push('SIGNALWIRE_API_TOKEN');
    if (!this.spaceUrl.trim()) missing.push('SIGNALWIRE_SPACE_URL');
    if (!String(this.fromNumber ?? '').replace(/\D/g, '')) {
      missing.push('SIGNALWIRE_PHONE_NUMBER');
    }
    if (missing.length) {
      throw new BadRequestException(
        `SignalWire is not configured. Add to .env: ${missing.join(', ')}. For the phone number use your SignalWire number in E.164, e.g. +15551234567`,
      );
    }
  }

  /**
   * LAML / Twilio-compatible E.164: exactly one leading + then digits only.
   * Never do `+${to}` when `to` may already include + (would become ++1555... and fail 21217).
   */
  private toE164(raw: string, role: 'From' | 'To'): string {
    const digits = String(raw ?? '').replace(/\D/g, '');
    if (!digits) {
      if (role === 'From') {
        throw new BadRequestException(
          'SignalWire sender number (SIGNALWIRE_PHONE_NUMBER) is missing or has no digits. Use E.164 like +15551234567',
        );
      }
      throw new BadRequestException(
        'Invalid destination phone: empty after normalization. Enter digits only or E.164 (+15551234567).',
      );
    }
    return '+' + digits;
  }

  /**
   * Send any SMS body (LAML / Twilio-compatible API).
   */
  async sendSms(to: string, body: string): Promise<void> {
    this.assertSignalWireConfigured();
    const trimmed = String(body ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('SMS body cannot be empty');
    }
    const url = `https://${this.spaceUrl}/api/laml/2010-04-01/Accounts/${this.projectId}/Messages.json`;

    await axios.post(
      url,
      new URLSearchParams({
        From: this.toE164(this.fromNumber, 'From'),
        To: this.toE164(to, 'To'),
        Body: trimmed,
      }),
      {
        auth: {
          username: this.projectId,
          password: this.apiToken,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );
  }

  /** Verification SMS (uses {@link sendSms}). */
  async sendText(to: string, code: string): Promise<void> {
    await this.sendSms(to, `Your verification code is: ${code}`);
  }
}
