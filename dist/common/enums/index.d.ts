export declare enum Role {
    SUPER_ADMIN = "super_admin",
    ORG_ADMIN = "org_admin",
    AGENT = "agent"
}
export declare enum FeaturePermission {
    ANALYTICS = "analytics",
    API_KEYS = "api_keys",
    CAMPAIGNS = "campaigns",
    CONTACTS = "contacts",
    FLOW_BUILDER = "flow_builder",
    INBOX = "inbox",
    MESSAGES = "messages",
    TEMPLATES = "templates",
    WABA = "waba",
    WALLET = "wallet",
    WEBHOOK = "webhook",
    PRICING = "pricing"
}
export declare const ALL_FEATURE_PERMISSIONS: FeaturePermission[];
export declare enum UserStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    PENDING = "pending"
}
export declare enum PlanType {
    FREE = "free",
    STARTER = "starter",
    PRO = "pro",
    ENTERPRISE = "enterprise"
}
export declare enum PlanStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare enum OrgStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    TRIAL = "trial"
}
