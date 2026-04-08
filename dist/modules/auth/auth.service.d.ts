import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private usersService;
    private orgsService;
    private jwtService;
    private config;
    constructor(usersService: UsersService, orgsService: OrganizationsService, jwtService: JwtService, config: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
        organization: import("../organizations/schemas/organization.schema").OrganizationDocument;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    refresh(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    private generateTokens;
    private sanitizeUser;
}
