import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateResumeDto, UpdateResumeDto } from './dto';
export declare class ResumeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: Prisma.JsonValue;
        template: string;
        userId: string;
    }[]>;
    findOne(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: Prisma.JsonValue;
        template: string;
        userId: string;
    }>;
    create(userId: string, dto: CreateResumeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: Prisma.JsonValue;
        template: string;
        userId: string;
    }>;
    update(userId: string, id: string, dto: UpdateResumeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: Prisma.JsonValue;
        template: string;
        userId: string;
    }>;
    remove(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: Prisma.JsonValue;
        template: string;
        userId: string;
    }>;
}
