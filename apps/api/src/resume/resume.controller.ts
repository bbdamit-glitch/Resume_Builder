
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ResumeService } from './resume.service';
import { AiResumeService } from './ai-resume.service';
import { CreateResumeDto, UpdateResumeDto } from './dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('resumes')
@UseGuards(JwtGuard)
export class ResumeController {
  constructor(
    private readonly resumes: ResumeService,
    private readonly aiResume: AiResumeService,
  ) {}

  @Get()
  list(@Req() req: any) {
    return this.resumes.findAll(req.user.sub);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.resumes.findOne(req.user.sub, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateResumeDto) {
    return this.resumes.create(req.user.sub, dto);
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateResumeDto,
  ) {
    return this.resumes.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.resumes.remove(req.user.sub, id);
  }

  @Post('transform')
  async transform(@Body() body: { text?: string }) {
    if (typeof body.text !== 'string' || !body.text.trim()) {
      throw new BadRequestException('Resume text is required.');
    }

    return this.aiResume.transformResume(body.text);
  }
}
