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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeController = void 0;
const common_1 = require("@nestjs/common");
const resume_service_1 = require("./resume.service");
const ai_resume_service_1 = require("./ai-resume.service");
const dto_1 = require("./dto");
const jwt_guard_1 = require("../auth/jwt.guard");
let ResumeController = class ResumeController {
    constructor(resumes, aiResume) {
        this.resumes = resumes;
        this.aiResume = aiResume;
    }
    list(req) {
        return this.resumes.findAll(req.user.sub);
    }
    get(req, id) {
        return this.resumes.findOne(req.user.sub, id);
    }
    create(req, dto) {
        return this.resumes.create(req.user.sub, dto);
    }
    update(req, id, dto) {
        return this.resumes.update(req.user.sub, id, dto);
    }
    remove(req, id) {
        return this.resumes.remove(req.user.sub, id);
    }
    async transform(body) {
        if (typeof body.text !== 'string' || !body.text.trim()) {
            throw new common_1.BadRequestException('Resume text is required.');
        }
        return this.aiResume.transformResume(body.text);
    }
};
exports.ResumeController = ResumeController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResumeController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ResumeController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateResumeDto]),
    __metadata("design:returntype", void 0)
], ResumeController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateResumeDto]),
    __metadata("design:returntype", void 0)
], ResumeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ResumeController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('transform'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResumeController.prototype, "transform", null);
exports.ResumeController = ResumeController = __decorate([
    (0, common_1.Controller)('resumes'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __metadata("design:paramtypes", [resume_service_1.ResumeService,
        ai_resume_service_1.AiResumeService])
], ResumeController);
//# sourceMappingURL=resume.controller.js.map