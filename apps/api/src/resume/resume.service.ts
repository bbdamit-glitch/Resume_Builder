import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateResumeDto, UpdateResumeDto } from './dto';

@Injectable()
export class ResumeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  async create(userId: string, dto: CreateResumeDto) {
    return this.prisma.resume.create({
      data: {
        name: dto.name,
        template: dto.template ?? 'classic',
        data: dto.data as Prisma.InputJsonValue,
        userId,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateResumeDto) {
    const existing = await this.findOne(userId, id);

    return this.prisma.resume.update({
      where: {
        id: existing.id,
      },
      data: {
        name: dto.name,
        template: dto.template,
        data: dto.data
          ? (dto.data as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.findOne(userId, id);

    return this.prisma.resume.delete({
      where: {
        id: existing.id,
      },
    });
  }
}