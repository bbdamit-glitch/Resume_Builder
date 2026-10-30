"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ResumeService = class ResumeService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.resume.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async findOne(userId, id) {
        const resume = await this.prisma.resume.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!resume) {
            throw new common_1.NotFoundException('Resume not found');
        }
        return resume;
    }
    async create(userId, dto) {
        return this.prisma.resume.create({
            data: {
                name: dto.name,
                template: dto.template ?? 'classic',
                data: dto.data,
                userId,
            },
        });
    }
    async update(userId, id, dto) {
        const existing = await this.findOne(userId, id);
        return this.prisma.resume.update({
            where: {
                id: existing.id,
            },
            data: {
                name: dto.name,
                template: dto.template,
                data: dto.data
                    ? dto.data
                    : undefined,
            },
        });
    }
    async remove(userId, id) {
        const existing = await this.findOne(userId, id);
        return this.prisma.resume.delete({
            where: {
                id: existing.id,
            },
        });
    }
};
exports.ResumeService = ResumeService;
exports.ResumeService = ResumeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResumeService);
//# sourceMappingURL=resume.service.js.map