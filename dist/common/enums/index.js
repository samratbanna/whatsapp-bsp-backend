"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgStatus = exports.PlanStatus = exports.PlanType = exports.UserStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["ORG_ADMIN"] = "org_admin";
    Role["AGENT"] = "agent";
})(Role || (exports.Role = Role = {}));
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