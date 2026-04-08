export enum Role {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  AGENT = 'agent',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum OrgStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}
