import { Role } from '../enums';
export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    orgId?: string;
}
export interface JwtRefreshPayload extends JwtPayload {
    refreshToken: string;
}
