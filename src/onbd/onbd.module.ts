import { Module } from '@nestjs/common';
import { OnbdController } from './onbd.controller';
import { OnbdService } from './onbd.service';

@Module({
  controllers: [OnbdController],
  providers: [OnbdService]
})
export class OnbdModule {}
