import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
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
}
