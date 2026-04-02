import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PrService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsGateway,
  ) {}

  async findAll(user: any, page: number, limit: number, status?: string) {
    const where: any = {};
    if (user.role === 'REQUESTER') where.createdById = user.sub;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.purchaseRequisition.findMany({
        where,
        include: { createdBy: { select: { id: true, name: true } }, items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.purchaseRequisition.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number, user: any) {
    const pr = await this.prisma.purchaseRequisition.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: true,
        approvalSteps: {
          include: { approver: { select: { id: true, name: true } }, logs: true },
          orderBy: { level: 'asc' },
        },
        auditLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!pr) throw new NotFoundException('PR not found');
    if (user.role === 'REQUESTER' && pr.createdById !== user.sub)
      throw new ForbiddenException();
    return pr;
  }

  async create(dto: any, userId: number) {
    const prNumber = `PR-${Date.now()}`;
    const totalAmount = dto.items.reduce(
      (sum: number, i: any) => sum + i.quantity * i.unitPrice,
      0,
    );

    const pr = await this.prisma.purchaseRequisition.create({
      data: {
        prNumber,
        title: dto.title,
        description: dto.description,
        totalAmount,
        createdById: userId,
        items: {
          create: dto.items.map((i: any) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.quantity * i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.auditLog.log(pr.id, 'CREATE', userId, user!.name);
    return pr;
  }

  async update(id: number, dto: any, user: any) {
    const pr = await this.prisma.purchaseRequisition.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('PR not found');
    if (pr.createdById !== user.sub) throw new ForbiddenException();
    if (pr.status !== 'DRAFT') throw new BadRequestException('Can only edit DRAFT PRs');

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;

    if (dto.items) {
      const totalAmount = dto.items.reduce(
        (sum: number, i: any) => sum + i.quantity * i.unitPrice, 0,
      );
      updateData.totalAmount = totalAmount;
      await this.prisma.purchaseItem.deleteMany({ where: { prId: id } });
      updateData.items = {
        create: dto.items.map((i: any) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
        })),
      };
    }

    return this.prisma.purchaseRequisition.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  }

  async remove(id: number, user: any) {
    const pr = await this.prisma.purchaseRequisition.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('PR not found');
    if (pr.createdById !== user.sub) throw new ForbiddenException();
    if (pr.status !== 'DRAFT') throw new BadRequestException('Can only delete DRAFT PRs');
    await this.prisma.purchaseRequisition.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  async submit(id: number, user: any) {
    const pr = await this.prisma.purchaseRequisition.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!pr) throw new NotFoundException('PR not found');
    if (pr.createdById !== user.sub) throw new ForbiddenException();
    if (pr.status !== 'DRAFT') throw new BadRequestException('PR already submitted');
    if (pr.items.length === 0) throw new BadRequestException('PR must have at least one item');

    // Find matching policy rule
    const amount = Number(pr.totalAmount);
    const policy = await this.prisma.policyRule.findFirst({
      where: {
        minAmount: { lte: amount },
        maxAmount: { gte: amount },
      },
    });

    const updatedPr = await this.prisma.purchaseRequisition.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    // Auto approve if policy says so
    if (policy?.autoApprove) {
      await this.prisma.purchaseRequisition.update({
        where: { id },
        data: { status: 'APPROVED' },
      });
      await this.auditLog.log(id, 'AUTO_APPROVE', user.sub, user.email);
    } else if (policy) {
      // Create approval steps
      const approverIds: number[] = JSON.parse(policy.approverIds);
      await this.prisma.approvalStep.createMany({
        data: approverIds.map((approverId, idx) => ({
          prId: id,
          approverId,
          level: idx + 1,
          status: idx === 0 ? 'PENDING' : 'PENDING',
        })),
      });
    }

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub } });
    await this.auditLog.log(id, 'SUBMIT', user.sub, dbUser!.name);
    this.notifications.emitPrSubmitted(id, pr.prNumber);
    return updatedPr;
  }
}
