"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const template_schema_1 = require("./schemas/template.schema");
const templates_service_1 = require("./templates.service");
const templates_controller_1 = require("./templates.controller");
const waba_module_1 = require("../waba/waba.module");
let TemplatesModule = class TemplatesModule {
};
exports.TemplatesModule = TemplatesModule;
exports.TemplatesModule = TemplatesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: template_schema_1.Template.name, schema: template_schema_1.TemplateSchema }]),
            waba_module_1.WabaModule,
        ],
        controllers: [templates_controller_1.TemplatesController],
        providers: [templates_service_1.TemplatesService],
        exports: [templates_service_1.TemplatesService],
    })
], TemplatesModule);
//# sourceMappingURL=templates.module.js.map