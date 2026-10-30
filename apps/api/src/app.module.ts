
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./prisma.service";
import { AuthModule } from "./auth/auth.module";
import { ResumeModule } from "./resume/resume.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["apps/api/.env", ".env"],
    }),
    AuthModule,
    ResumeModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
