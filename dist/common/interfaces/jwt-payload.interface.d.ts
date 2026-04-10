import { FeaturePermission, Role } from '../enums';
export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    orgId?: string;
    permissions?: FeaturePermission[];
}
export interface JwtRefreshPayload extends JwtPayload {
    refreshToken: string;
}
