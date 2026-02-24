import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import {JwtService} from '@nestjs/jwt'
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt'



@Injectable()
export class UsersService {
   
  constructor (
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
     private readonly jwtService: JwtService,
      @Inject('GOOGLE_CLIENT')
    private readonly googleClient: OAuth2Client
    
  ){
    
  }
  async getUser({user_id}){
      const user=await this.userRepo.findOneBy({user_id})
      return {...user}
      
  }
  

    async createNewUser(newUser:any) {
      const {first_name,last_name,email,password,auth_type='reg'}=newUser;

      const user = await this.getUserByEmail(email);

      if(user){throw new ConflictException('Account already exists');}
      const account= this.userRepo.create({
        first_name,
        last_name,
        email,
        password:await this.hashPassword(password),
        auth_type,
      })

      const {user_id}=await this.userRepo.save(account);

      return this.jwtService.signAsync({user_id,email})
      
    
    
  }

  async login(user:{email:string,password:string}){
    const savedUser =await this.getUserByEmail(user.email);
    if(!user) throw new UnauthorizedException('Invalid password or email');

    if(!(await bcrypt.compare(user.password,savedUser?.password))) throw new UnauthorizedException('Invalid password or email');

    return await this.createToken({user_id:savedUser?.user_id,email:savedUser?.email})

  }

 async googleLogin(credential: string) {
    // 1️ Verify Google token
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException('Invalid Google token');

    const { email, given_name, family_name } = payload;

    // 2️⃣ Find or create user
    let user = await this.getUserByEmail(email);

    if (!user) {
      user = this.userRepo.create({
        email,
        first_name: given_name,
        last_name: family_name,
       
        auth_type: 'google',
        
      });

      await this.userRepo.save(user);
    }


  

    // 3️⃣ Issue YOUR JWT
    const accessToken = await this.createToken(user);

    return {
      accessToken,
    }
  }

  
  private async getUserByEmail(email){
    return await this.userRepo.findOneBy({
          email
      })
  }

  private async createToken({user_id,email}){
      return await this.jwtService.signAsync({user_id,email})
  }

  private async hashPassword(password:string){
    return await bcrypt.hash(password, 10);
  }
}

