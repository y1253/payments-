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
  private hashCC(cc: string): string {
    return createHash('sha256')
      .update(process.env.CC_HASH_SECRET + cc)
      .digest('hex');
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
        select:['last_4'],
      where: { user_id },
    });
  }

  async addCard(user_id: number, cc: string) {

   const savedCc=await  this.ccRepo.findOneBy({hash:this.hashCC(cc)})
   if(savedCc) throw new ConflictException('Cc number already exists')
    const card = this.ccRepo.create({
      user_id,
      hash: this.hashCC(cc),
      encrypted_number: this.encryptCC(cc),
      last_4: cc.slice(-4),
    });

    return await  this.ccRepo.save(card);
  }
}