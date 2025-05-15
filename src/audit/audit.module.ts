import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule], providers: [AuditService] })
export class AuditModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditService).forRoutes('*');
  }
}
