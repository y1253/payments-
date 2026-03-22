import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phone } from './phone.entity';
import { SignalwireService } from '../signalwire/signalwire.service';

interface PendingVerification {
  code: string;
  user_id: number;
  expiresAt: number;
}

@Injectable()
export class PhonesService {
  private readonly pending = new Map<string, PendingVerification>();

  /**
   * Normalize client `{ phone: '...' }` to one E.164 string used for pending map + DB + SignalWire.
   * US 10-digit numbers without country code get +1.
   */
  normalizePhone(phone: string): string {
    const raw = String(phone ?? '').trim();
    if (!raw) {
      throw new BadRequestException('phone is required');
    }
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      throw new BadRequestException('Invalid phone number');
    }
    if (digits.length === 10) {
      return '+1' + digits;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return '+' + digits;
    }
    return '+' + digits;
  }

  constructor(
    @InjectRepository(Phone)
    private readonly phoneRepo: Repository<Phone>,
    private readonly signalwireService: SignalwireService,
  ) {}

  async requestVerification(phone: string, user_id: number): Promise<void> {
    const existing = await this.phoneRepo.findOne({ where: { user_id } });
    if (existing) {
      throw new BadRequestException('User already has a phone number');
    }

    const normalized = this.normalizePhone(phone);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.pending.set(normalized, { code, user_id, expiresAt });

    await this.signalwireService.sendText(normalized, code);
  }

  async findAllByUserId(user_id: number): Promise<Phone[]> {
    return this.phoneRepo.find({ where: { user_id }, order: { create_at: 'DESC' } });
  }

  async verify(phone: string, code: string): Promise<Phone> {
    const normalized = this.normalizePhone(phone);
    const entry = this.pending.get(normalized);

    if (!entry) {
      throw new BadRequestException('No pending verification for this number');
    }

    if (Date.now() > entry.expiresAt) {
      this.pending.delete(normalized);
      throw new BadRequestException('Verification code expired');
    }

    if (entry.code !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    const alreadySaved = await this.phoneRepo.findOne({
      where: { user_id: entry.user_id },
    });
    if (alreadySaved) {
      this.pending.delete(normalized);
      throw new BadRequestException('User already has a phone number');
    }

    this.pending.delete(normalized);

    const newPhone = this.phoneRepo.create({
      phone: normalized,
      user_id: entry.user_id,
    });
    return this.phoneRepo.save(newPhone);
  }
}
