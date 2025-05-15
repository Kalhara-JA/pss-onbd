import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common/exceptions';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  signPayload(userId: string, role: string) {
    return this.jwtService.sign({ sub: userId, role });
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { access_token: token };
  }

  private async validateUser(email: string, password: string) {
    const user = await this.prisma.contributor.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid credentials');

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) throw new BadRequestException('Invalid credentials');

    return user;
  }
}
