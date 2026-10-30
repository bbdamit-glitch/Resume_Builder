import { ResumeService } from './resume.service';
import { AiResumeService } from './ai-resume.service';
import { CreateResumeDto, UpdateResumeDto } from './dto';
export declare class ResumeController {
    private readonly resumes;
    private readonly aiResume;
    constructor(resumes: ResumeService, aiResume: AiResumeService);
    list(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: import("@prisma/client/runtime/library").JsonValue;
        template: string;
        userId: string;
    }[]>;
    get(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: import("@prisma/client/runtime/library").JsonValue;
        template: string;
        userId: string;
    }>;
    create(req: any, dto: CreateResumeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: import("@prisma/client/runtime/library").JsonValue;
        template: string;
        userId: string;
    }>;
    update(req: any, id: string, dto: UpdateResumeDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: import("@prisma/client/runtime/library").JsonValue;
        template: string;
        userId: string;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        data: import("@prisma/client/runtime/library").JsonValue;
        template: string;
        userId: string;
    }>;
    transform(body: {
        text?: string;
    }): Promise<{
        mode: string;
        warning: string;
        data: {
            profile: {
                fullName: string;
                title: string;
                email: string;
                phone: string;
                location: string;
                linkedin: string;
                summary: string;
            };
            skills: string[];
            experience: {
                company: string;
                role: string;
                dates: string;
                bullets: string[];
            }[];
            education: {
                school: string;
                degree: string;
                dates: string;
            }[];
            design: {
                color: string;
                font: string;
                visibleSections: string[];
            };
        };
    } | undefined>;
}
