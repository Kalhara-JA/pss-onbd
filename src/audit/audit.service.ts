import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

@Injectable()
export class AuditService implements NestMiddleware {
  private readonly logger = new Logger(AuditService.name);
  constructor(private prisma: PrismaService) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    res.on('finish', () => {
      void (async () => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: req.user?.userId ?? null,
              ip: req.ip || '',
              endpoint: req.originalUrl,
              statusCode: res.statusCode,
            },
          });
        } catch (err) {
          this.logger.error('Failed to write audit log', err);
        }
      })();
    });

    next();
  }
}
