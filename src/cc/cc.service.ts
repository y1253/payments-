import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cc } from './cc.entity';
import { Repository } from 'typeorm';
import { createHash, createCipheriv, randomBytes } from 'crypto';

@Injectable()
export class CcService {
  constructor(
    @InjectRepository(Cc)
    private readonly ccRepo: Repository<Cc>,
  ) {}

  // Same input always = same output. For lookups.
   hashCC(cc: string): string {
    return createHash('sha256')
      .update(process.env.CC_HASH_SECRET + cc)
      .digest('hex');
  }

  private detectCardType(cc: string): string {
    const sanitized = cc.replace(/\D/g, '');

    // Visa: starts with 4, length 13,16,19
    if (/^4\d{12}(\d{3})?(\d{3})?$/.test(sanitized)) {
      return 'VISA';
    }

    // American Express: starts with 34 or 37, length 15
    if (/^3[47]\d{13}$/.test(sanitized)) {
      return 'AMERICAN_EXPRESS';
    }

    return 'UNKNOWN';
  }

  // Different output every time. For storage.
  private encryptCC(cc: string): string {
    const key = Buffer.from(process.env.CC_ENCRYPT_KEY as string, 'hex'); // 32 bytes
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(cc, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Store IV with the ciphertext so you can decrypt later
    return iv.toString('hex') + ':' + encrypted;
  }

  getCards(user_id: number) {
    return this.ccRepo.find({
        select:['last_4','type'],
      where: { user_id },
    });
  }

  async addCard(user_id: number, cc: string) {

   const savedCc=await  this.getCcByNumber(this.hashCC(cc))
   if(savedCc) throw new ConflictException('Cc number already exists')
    const card = this.ccRepo.create({
      user_id,
      hash: this.hashCC(cc),
      encrypted_number: this.encryptCC(cc),
      last_4: cc.slice(-4),
      type: this.detectCardType(cc),
    });

    return await  this.ccRepo.save(card);
  }

  async getCcByNumber(cc){
   return await  this.ccRepo.findOneBy({hash:cc})
  }

  async getCcByLast4(last_4:string,user_id:number){
    return await this.ccRepo.findOneBy({
      user_id,last_4
    })
  }
}