import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterContributorDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['pgc', 'npgc'], required: false })
  @IsOptional()
  @IsEnum(['pgc', 'npgc'])
  role?: 'pgc' | 'npgc';
}
