import {
  Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { PrService } from './pr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseItemDto {
  @IsString() description: string;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() @Min(0) unitPrice: number;
}

export class CreatePrDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}

export class UpdatePrDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PurchaseItemDto)
  items?: PurchaseItemDto[];
}

@UseGuards(JwtAuthGuard)
@Controller('pr')
export class PrController {
  constructor(private prService: PrService) {}

  @Get()
  findAll(@Request() req, @Query('page') page = '1', @Query('limit') limit = '10', @Query('status') status?: string) {
    return this.prService.findAll(req.user, +page, +limit, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.prService.findOne(id, req.user);
  }

  @Post()
  create(@Body() dto: CreatePrDto, @Request() req) {
    return this.prService.create(dto, req.user.sub);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePrDto, @Request() req) {
    return this.prService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.prService.remove(id, req.user);
  }

  @Post(':id/submit')
  submit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.prService.submit(id, req.user);
  }
}
