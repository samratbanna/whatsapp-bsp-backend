"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WabaModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const waba_schema_1 = require("./schemas/waba.schema");
const waba_service_1 = require("./waba.service");
const waba_controller_1 = require("./waba.controller");
let WabaModule = class WabaModule {
};
exports.WabaModule = WabaModule;
exports.WabaModule = WabaModule = __decorate([
    (0, common_1.Module)({
        imports: [mongoose_1.MongooseModule.forFeature([{ name: waba_schema_1.Waba.name, schema: waba_schema_1.WabaSchema }])],
        controllers: [waba_controller_1.WabaController],
        providers: [waba_service_1.WabaService],
        exports: [waba_service_1.WabaService],
    })
], WabaModule);
//# sourceMappingURL=waba.module.js.map