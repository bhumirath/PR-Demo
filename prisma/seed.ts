import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });
  const approverRole = await prisma.role.upsert({
    where: { name: 'APPROVER' },
    update: {},
    create: { name: 'APPROVER' },
  });
  const requesterRole = await prisma.role.upsert({
    where: { name: 'REQUESTER' },
    update: {},
    create: { name: 'REQUESTER' },
  });

  // Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pr-app.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@pr-app.com',
      password: await bcrypt.hash('Admin@1234', 10),
      roleId: adminRole.id,
    },
  });

  const approver1 = await prisma.user.upsert({
    where: { email: 'approver1@pr-app.com' },
    update: {},
    create: {
      name: 'Manager One',
      email: 'approver1@pr-app.com',
      password: await bcrypt.hash('Approver@1234', 10),
      roleId: approverRole.id,
    },
  });

  const approver2 = await prisma.user.upsert({
    where: { email: 'approver2@pr-app.com' },
    update: {},
    create: {
      name: 'Director Two',
      email: 'approver2@pr-app.com',
      password: await bcrypt.hash('Approver@1234', 10),
      roleId: approverRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@pr-app.com' },
    update: {},
    create: {
      name: 'John Requester',
      email: 'user@pr-app.com',
      password: await bcrypt.hash('User@1234', 10),
      roleId: requesterRole.id,
    },
  });

  // Policy Rules
  await prisma.policyRule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Auto Approve < 1,000',
      minAmount: 0,
      maxAmount: 999.99,
      autoApprove: true,
      approverIds: '[]',
    },
  });

  await prisma.policyRule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Single Approval 1,000–50,000',
      minAmount: 1000,
      maxAmount: 50000,
      autoApprove: false,
      approverIds: JSON.stringify([approver1.id]),
    },
  });

  await prisma.policyRule.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Multi-level Approval > 50,000',
      minAmount: 50000.01,
      maxAmount: 9999999,
      autoApprove: false,
      approverIds: JSON.stringify([approver1.id, approver2.id]),
    },
  });

  console.log('Seed completed!');
  console.log('Admin:    admin@pr-app.com / Admin@1234');
  console.log('Approver: approver1@pr-app.com / Approver@1234');
  console.log('User:     user@pr-app.com / User@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
