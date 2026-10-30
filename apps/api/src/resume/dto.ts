import { IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateResumeDto {
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @IsOptional() @IsString() template?: string;
  @IsObject() data!: Record<string, unknown>;
}

export class UpdateResumeDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() template?: string;
  @IsOptional() @IsObject() data?: Record<string, unknown>;
}