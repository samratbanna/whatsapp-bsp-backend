export enum Role {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  AGENT = 'agent',
}

export enum FeaturePermission {
  ANALYTICS = 'analytics',
  API_KEYS = 'api_keys',
  CAMPAIGNS = 'campaigns',
  CONTACTS = 'contacts',
  FLOW_BUILDER = 'flow_builder',
  INBOX = 'inbox',
  MESSAGES = 'messages',
  TEMPLATES = 'templates',
  WABA = 'waba',
  WALLET = 'wallet',
  WEBHOOK = 'webhook',
  PRICING = 'pricing',
}

export const ALL_FEATURE_PERMISSIONS = Object.values(FeaturePermission);

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
