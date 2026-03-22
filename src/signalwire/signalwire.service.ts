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
    this.projectId = this.configService.get<string>('SIGNALWIRE_PROJECT_ID')!;
    this.apiToken = this.configService.get<string>('SIGNALWIRE_API_TOKEN')!;
    this.spaceUrl = this.configService.get<string>('SIGNALWIRE_SPACE_URL')!;
    this.fromNumber = this.configService.get<string>('SIGNALWIRE_PHONE_NUMBER')!;
  }

  /**
   * LAML / Twilio-compatible E.164: exactly one leading + then digits only.
   * Never do `+${to}` when `to` may already include + (would become ++1555... and fail 21217).
   */
  private toE164(raw: string): string {
    const digits = String(raw ?? '').replace(/\D/g, '');
    if (!digits) {
      throw new BadRequestException('Invalid phone: empty after normalization');
    }
    return '+' + digits;
  }

  async sendText(to: string, code: string): Promise<void> {
    const url = `https://${this.spaceUrl}/api/laml/2010-04-01/Accounts/${this.projectId}/Messages.json`;

    await axios.post(
      url,
      new URLSearchParams({
        From: this.toE164(this.fromNumber),
        To: this.toE164(to),
        Body: `Your verification code is: ${code}`,
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
}
