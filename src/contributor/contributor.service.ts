import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteContributorDto } from './dto/invite-contributor.dto';
import { RegisterContributorDto } from './dto/register-contributor.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ContributorService {
  constructor(private prisma: PrismaService) {}

  async invite(dto: InviteContributorDto) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.invitation.create({ data: { ...dto, token, expiresAt } });
    return { token, expiresAt };
  }
  async register(dto: RegisterContributorDto) {
    const inv = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
    });
    if (!inv || inv.used || inv.expiresAt < new Date())
      throw new BadRequestException('Invalid or expired token');
    const hashed = await bcrypt.hash(dto.password, 10);
    const contributor = await this.prisma.contributor.create({
      data: {
        email: inv.email,
        name: dto.name,
        password: hashed,
        role: dto.role || inv.role,
        status: 'pending_approval',
        bankAccount: this.encrypt(''),
      },
    });
    await this.prisma.invitation.update({
      where: { token: dto.token },
      data: { used: true },
    });
    return contributor;
  }

  async status(id: string) {
    const c = await this.prisma.contributor.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    return { status: c.status };
  }

  private encrypt(text: string): string {
    const aesKey = process.env.AES_KEY;
    if (!aesKey) {
      throw new Error('AES_KEY environment variable is not defined');
    }
    const key = Buffer.from(aesKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }
}
