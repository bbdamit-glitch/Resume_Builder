import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import { LoginDto, RegisterDto } from "./dto";
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null | undefined;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null | undefined;
        };
    }>;
    private issueToken;
}
