import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PrModule } from './pr/pr.module';
import { ApprovalModule } from './approval/approval.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PrModule,
    ApprovalModule,
    AuditLogModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}
