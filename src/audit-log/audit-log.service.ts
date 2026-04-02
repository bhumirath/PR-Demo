import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(prId: number, action: string, userId: number, userName: string, comment?: string) {
    return this.prisma.auditLog.create({
      data: { prId, action, userId, userName, comment },
    });
  }
}
