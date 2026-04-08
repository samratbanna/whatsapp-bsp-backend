"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowBuilderModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const flow_schema_1 = require("./schemas/flow.schema");
const flow_builder_service_1 = require("./flow-builder.service");
const flow_builder_controller_1 = require("./flow-builder.controller");
const flow_executor_1 = require("./executors/flow.executor");
const waba_module_1 = require("../waba/waba.module");
let FlowBuilderModule = class FlowBuilderModule {
};
exports.FlowBuilderModule = FlowBuilderModule;
exports.FlowBuilderModule = FlowBuilderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: flow_schema_1.Flow.name, schema: flow_schema_1.FlowSchema },
                { name: flow_schema_1.FlowSession.name, schema: flow_schema_1.FlowSessionSchema },
            ]),
            waba_module_1.WabaModule,
        ],
        controllers: [flow_builder_controller_1.FlowBuilderController],
        providers: [flow_builder_service_1.FlowBuilderService, flow_executor_1.FlowExecutor],
        exports: [flow_builder_service_1.FlowBuilderService, flow_executor_1.FlowExecutor],
    })
], FlowBuilderModule);
//# sourceMappingURL=flow-builder.module.js.map