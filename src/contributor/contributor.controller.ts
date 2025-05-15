import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { ContributorService } from './contributor.service';
import { InviteContributorDto } from './dto/invite-contributor.dto';
import { RegisterContributorDto } from './dto/register-contributor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Contributors')
@Controller()
export class ContributorController {
  constructor(private svc: ContributorService) {}

  @Post('invite-contributor')
  @ApiOperation({ summary: 'Invite a new contributor' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60,
    },
  })
  invite(@Body() dto: InviteContributorDto) {
    return this.svc.invite(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a contributor' })
  @Throttle({
    default: {
      limit: 5,
      ttl: 60,
    },
  })
  register(@Body() dto: RegisterContributorDto) {
    return this.svc.register(dto);
  }

  @Get('registration-status/:id')
  @ApiOperation({ summary: 'Get registration status' })
  status(@Param('id') id: string) {
    return this.svc.status(id);
  }
}
