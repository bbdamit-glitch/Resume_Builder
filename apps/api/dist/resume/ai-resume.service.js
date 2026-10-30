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
exports.AiResumeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
let AiResumeService = class AiResumeService {
    constructor(config) {
        this.config = config;
    }
    async transformResume(text) {
        const apiKey = this.config.get('OPENAI_API_KEY');
        if (!apiKey) {
            throw new common_1.ServiceUnavailableException('AI service is not configured. Set OPENAI_API_KEY in the API .env file.');
        }
        if (!text || text.trim().length < 50) {
            throw new common_1.ServiceUnavailableException('Please provide enough resume text to analyze.');
        }
        const client = new openai_1.default({ apiKey });
        console.log('AI transform called. Input length:', text.length);
        let response;
        try {
            response = await client.chat.completions.create({
                model: this.config.get('OPENAI_MODEL') ||
                    'gpt-4o-mini',
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: `
You are a professional resume editor.

Transform the supplied resume into structured, professional resume data.

Return valid JSON with this structure:
{
  "profile": {
    "fullName": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "summary": ""
  },
  "skills": [],
  "experience": [
    {
      "company": "",
      "role": "",
      "dates": "",
      "bullets": []
    }
  ],
  "education": [
    {
      "school": "",
      "degree": "",
      "dates": ""
    }
  ],
  "design": {
    "color": "#2563eb",
    "font": "Arial",
    "visibleSections": [
      "summary",
      "experience",
      "education",
      "skills"
    ]
  }
}

Rules:
- Preserve the candidate's actual facts and employment history.
- Improve grammar, clarity, and professional wording.
- Organize information into appropriate sections.
- Do not invent employers, dates, qualifications, skills,
  metrics, responsibilities, or achievements.
- Do not infer missing personal details.
- Use empty strings or empty arrays for missing information.
- Use concise, professional bullet points.
- Keep skills as an array of strings.
- Return JSON only.
            `,
                    },
                    {
                        role: 'user',
                        content: `Transform this resume:\n\n${text.slice(0, 30000)}`,
                    },
                ],
            });
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Unknown OpenAI error';
            console.error('OpenAI request failed:', message);
            if (/429|no credits|quota|billing/i.test(message)) {
                const lines = text
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean);
                const skillsLine = lines.find((line) => /^skills?\s*:/i.test(line));
                const experienceLine = lines.find((line) => /\b(?:19|20)\d{2}\s*[-–]\s*(?:present|(?:19|20)\d{2})\b/i.test(line));
                const educationLine = lines.find((line) => /bachelor|master|university|college|degree/i.test(line));
                const dateMatch = experienceLine?.match(/\b(?:19|20)\d{2}\s*[-–]\s*(?:present|(?:19|20)\d{2})\b/i);
                return {
                    mode: 'mock',
                    warning: 'Local mock mode: OpenAI credits are unavailable. No AI rewriting was performed.',
                    data: {
                        profile: {
                            fullName: lines[0] ?? '',
                            title: lines[1] ?? '',
                            email: '',
                            phone: '',
                            location: '',
                            linkedin: '',
                            summary: '',
                        },
                        skills: skillsLine
                            ? skillsLine
                                .replace(/^skills?\s*:/i, '')
                                .split(',')
                                .map((skill) => skill.trim())
                                .filter(Boolean)
                            : [],
                        experience: experienceLine
                            ? [
                                {
                                    company: experienceLine
                                        .split(',')[0]
                                        .trim(),
                                    role: lines[1] ?? '',
                                    dates: dateMatch?.[0] ?? '',
                                    bullets: lines.filter((line) => /developed|built|managed|created|implemented/i.test(line)),
                                },
                            ]
                            : [],
                        education: educationLine
                            ? [
                                {
                                    school: educationLine,
                                    degree: '',
                                    dates: '',
                                },
                            ]
                            : [],
                        design: {
                            color: '#2563eb',
                            font: 'Arial',
                            visibleSections: [
                                'summary',
                                'experience',
                                'education',
                                'skills',
                            ],
                        },
                    },
                };
            }
            throw new common_1.ServiceUnavailableException('AI service failed. Check the API terminal logs.');
        }
    }
};
exports.AiResumeService = AiResumeService;
exports.AiResumeService = AiResumeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiResumeService);
//# sourceMappingURL=ai-resume.service.js.map