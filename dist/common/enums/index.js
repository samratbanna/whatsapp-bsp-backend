"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgStatus = exports.PlanStatus = exports.PlanType = exports.UserStatus = exports.ALL_FEATURE_PERMISSIONS = exports.FeaturePermission = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["ORG_ADMIN"] = "org_admin";
    Role["AGENT"] = "agent";
})(Role || (exports.Role = Role = {}));
var FeaturePermission;
(function (FeaturePermission) {
    FeaturePermission["ANALYTICS"] = "analytics";
    FeaturePermission["API_KEYS"] = "api_keys";
    FeaturePermission["CAMPAIGNS"] = "campaigns";
    FeaturePermission["CONTACTS"] = "contacts";
    FeaturePermission["FLOW_BUILDER"] = "flow_builder";
    FeaturePermission["INBOX"] = "inbox";
    FeaturePermission["MESSAGES"] = "messages";
    FeaturePermission["TEMPLATES"] = "templates";
    FeaturePermission["WABA"] = "waba";
    FeaturePermission["WALLET"] = "wallet";
    FeaturePermission["WEBHOOK"] = "webhook";
    FeaturePermission["PRICING"] = "pricing";
})(FeaturePermission || (exports.FeaturePermission = FeaturePermission = {}));
exports.ALL_FEATURE_PERMISSIONS = Object.values(FeaturePermission);
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["PENDING"] = "pending";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var PlanType;
(function (PlanType) {
    PlanType["FREE"] = "free";
    PlanType["STARTER"] = "starter";
    PlanType["PRO"] = "pro";
    PlanType["ENTERPRISE"] = "enterprise";
})(PlanType || (exports.PlanType = PlanType = {}));
var PlanStatus;
(function (PlanStatus) {
    PlanStatus["ACTIVE"] = "active";
    PlanStatus["INACTIVE"] = "inactive";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
var OrgStatus;
(function (OrgStatus) {
    OrgStatus["ACTIVE"] = "active";
    OrgStatus["SUSPENDED"] = "suspended";
    OrgStatus["TRIAL"] = "trial";
})(OrgStatus || (exports.OrgStatus = OrgStatus = {}));
//# sourceMappingURL=index.js.map