import { Module } from '@nestjs/common';
import { ContributorService } from './contributor.service';
import { ContributorController } from './contributor.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [ContributorService],
  controllers: [ContributorController],
})
export class ContributorModule {}
