
import { Module } from '@nestjs/common';

import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { AiResumeService } from './ai-resume.service';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ResumeController],
  providers: [ResumeService, PrismaService, AiResumeService],
})
export class ResumeModule {}
