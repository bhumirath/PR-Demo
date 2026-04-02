import {
  Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsString() name: string;
  @IsString() email: string;
  @IsString() password: string;
  @IsNumber() roleId: number;
}

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsNumber() roleId?: number;
}

export class PolicyRuleDto {
  @IsString() name: string;
  @IsNumber() minAmount: number;
  @IsNumber() maxAmount: number;
  @IsBoolean() autoApprove: boolean;
  @IsArray() approverIds: number[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  getUsers() { return this.adminService.getUsers(); }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) { return this.adminService.createUser(dto); }

  @Put('users/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) { return this.adminService.deleteUser(id); }

  @Get('roles')
  getRoles() { return this.adminService.getRoles(); }

  @Get('policies')
  getPolicies() { return this.adminService.getPolicies(); }

  @Post('policies')
  createPolicy(@Body() dto: PolicyRuleDto) { return this.adminService.createPolicy(dto); }

  @Put('policies/:id')
  updatePolicy(@Param('id', ParseIntPipe) id: number, @Body() dto: PolicyRuleDto) {
    return this.adminService.updatePolicy(id, dto);
  }

  @Delete('policies/:id')
  deletePolicy(@Param('id', ParseIntPipe) id: number) { return this.adminService.deletePolicy(id); }
}
