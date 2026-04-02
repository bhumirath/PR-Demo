import {
  Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Request,
} from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsOptional, IsString } from 'class-validator';

export class ApproveDto {
  @IsOptional() @IsString() comment?: string;
}

export class RejectDto {
  @IsString() comment: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class ApprovalController {
  constructor(private approvalService: ApprovalService) {}

  @Get('approval/pending')
  getPending(@Request() req) {
    return this.approvalService.getPending(req.user.sub);
  }

  @Post('pr/:id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveDto,
    @Request() req,
  ) {
    return this.approvalService.approve(id, req.user, dto.comment);
  }

  @Post('pr/:id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectDto,
    @Request() req,
  ) {
    return this.approvalService.reject(id, req.user, dto.comment);
  }
}
