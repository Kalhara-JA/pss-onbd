import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteContributorDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['pgc', 'npgc'] })
  @IsEnum(['pgc', 'npgc'])
  role: 'pgc' | 'npgc';

  @ApiProperty({ required: false })
  @IsOptional()
  department?: string;
}
