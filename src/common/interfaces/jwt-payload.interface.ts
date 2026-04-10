import { FeaturePermission, Role } from '../enums';

export interface JwtPayload {
  sub: string;       // user _id
  email: string;
  role: Role;
  orgId?: string;    // null for super_admin
  permissions?: FeaturePermission[];
}

export interface JwtRefreshPayload extends JwtPayload {
  refreshToken: string;
}
