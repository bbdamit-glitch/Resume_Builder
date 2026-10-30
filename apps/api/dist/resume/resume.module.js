"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeModule = void 0;
const common_1 = require("@nestjs/common");
const resume_controller_1 = require("./resume.controller");
const resume_service_1 = require("./resume.service");
const ai_resume_service_1 = require("./ai-resume.service");
const prisma_service_1 = require("../prisma.service");
const auth_module_1 = require("../auth/auth.module");
let ResumeModule = class ResumeModule {
};
exports.ResumeModule = ResumeModule;
exports.ResumeModule = ResumeModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [resume_controller_1.ResumeController],
        providers: [resume_service_1.ResumeService, prisma_service_1.PrismaService, ai_resume_service_1.AiResumeService],
    })
], ResumeModule);
//# sourceMappingURL=resume.module.js.map