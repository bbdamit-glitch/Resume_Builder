
import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiResumeService {
  constructor(private readonly config: ConfigService) {}

  async transformResume(text: string) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI service is not configured. Set OPENAI_API_KEY in the API .env file.',
      );
    }

    if (!text || text.trim().length < 50) {
      throw new ServiceUnavailableException(
        'Please provide enough resume text to analyze.',
      );
    }

    const client = new OpenAI({ apiKey });

    console.log(
      'AI transform called. Input length:',
      text.length,
    );

    let response;

    try {
      response = await client.chat.completions.create({
        model:
          this.config.get<string>('OPENAI_MODEL') ||
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
    
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown OpenAI error';

      console.error('OpenAI request failed:', message);

      // Free local fallback when API credits are unavailable.
      if (/429|no credits|quota|billing/i.test(message)) {
        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        const skillsLine = lines.find((line) =>
          /^skills?\s*:/i.test(line),
        );

        const experienceLine = lines.find((line) =>
          /\b(?:19|20)\d{2}\s*[-–]\s*(?:present|(?:19|20)\d{2})\b/i.test(
            line,
          ),
        );

        const educationLine = lines.find((line) =>
          /bachelor|master|university|college|degree/i.test(line),
        );

        const dateMatch = experienceLine?.match(
          /\b(?:19|20)\d{2}\s*[-–]\s*(?:present|(?:19|20)\d{2})\b/i,
        );

        return {
          mode: 'mock',
          warning:
            'Local mock mode: OpenAI credits are unavailable. No AI rewriting was performed.',
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
                    bullets: lines.filter((line) =>
                      /developed|built|managed|created|implemented/i.test(
                        line,
                      ),
                    ),
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

      throw new ServiceUnavailableException(
        'AI service failed. Check the API terminal logs.',
      );
    }
  }
}