import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  getUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async createUser(dto: any) {
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { ...dto, password: hashed },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  updateUser(id: number, dto: any) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async deleteUser(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  getRoles() {
    return this.prisma.role.findMany();
  }

  getPolicies() {
    return this.prisma.policyRule.findMany();
  }

  createPolicy(dto: any) {
    return this.prisma.policyRule.create({
      data: { ...dto, approverIds: JSON.stringify(dto.approverIds) },
    });
  }

  updatePolicy(id: number, dto: any) {
    return this.prisma.policyRule.update({
      where: { id },
      data: { ...dto, approverIds: JSON.stringify(dto.approverIds) },
    });
  }

  async deletePolicy(id: number) {
    await this.prisma.policyRule.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
