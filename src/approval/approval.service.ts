import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsGateway,
  ) {}

  async getPending(userId: number) {
    const steps = await this.prisma.approvalStep.findMany({
      where: { approverId: userId, status: 'PENDING' },
      include: {
        pr: { include: { createdBy: { select: { id: true, name: true } }, items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return steps;
  }

  async approve(prId: number, user: any, comment?: string) {
    const step = await this.prisma.approvalStep.findFirst({
      where: { prId, approverId: user.sub, status: 'PENDING' },
    });
    if (!step) throw new NotFoundException('No pending approval step found');

    await this.prisma.approvalStep.update({
      where: { id: step.id },
      data: { status: 'APPROVED', comment, decidedAt: new Date() },
    });

    await this.prisma.approvalLog.create({
      data: { stepId: step.id, userId: user.sub, action: 'APPROVE', comment },
    });

    // Check if there's a next step
    const nextStep = await this.prisma.approvalStep.findFirst({
      where: { prId, level: step.level + 1 },
    });

    const pr = await this.prisma.purchaseRequisition.findUnique({ where: { id: prId } });
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub } });

    if (!nextStep) {
      // All levels approved
      await this.prisma.purchaseRequisition.update({
        where: { id: prId },
        data: { status: 'APPROVED' },
      });
      await this.auditLog.log(prId, 'APPROVE', user.sub, dbUser!.name, comment);
      this.notifications.emitPrApproved(prId, pr!.prNumber);
    } else {
      await this.auditLog.log(prId, `APPROVE_LEVEL_${step.level}`, user.sub, dbUser!.name, comment);
    }

    return { message: 'Approved' };
  }

  async reject(prId: number, user: any, comment: string) {
    const step = await this.prisma.approvalStep.findFirst({
      where: { prId, approverId: user.sub, status: 'PENDING' },
    });
    if (!step) throw new NotFoundException('No pending approval step found');

    await this.prisma.approvalStep.update({
      where: { id: step.id },
      data: { status: 'REJECTED', comment, decidedAt: new Date() },
    });

    await this.prisma.approvalLog.create({
      data: { stepId: step.id, userId: user.sub, action: 'REJECT', comment },
    });

    await this.prisma.purchaseRequisition.update({
      where: { id: prId },
      data: { status: 'REJECTED' },
    });

    const pr = await this.prisma.purchaseRequisition.findUnique({ where: { id: prId } });
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub } });
    await this.auditLog.log(prId, 'REJECT', user.sub, dbUser!.name, comment);
    this.notifications.emitPrRejected(prId, pr!.prNumber);

    return { message: 'Rejected' };
  }
}
