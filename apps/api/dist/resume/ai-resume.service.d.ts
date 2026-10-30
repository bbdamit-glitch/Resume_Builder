import { ConfigService } from '@nestjs/config';
export declare class AiResumeService {
    private readonly config;
    constructor(config: ConfigService);
    transformResume(text: string): Promise<{
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
