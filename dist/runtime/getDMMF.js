"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = require("@prisma/sdk");
const externalToInternalDmmf_1 = require("./externalToInternalDmmf");
const transformDmmf_1 = require("./transformDmmf");
function getPhotonDMMF(dmmf) {
    return transformDmmf_1.transformDmmf(externalToInternalDmmf_1.externalToInternalDmmf(dmmf));
}
exports.getPhotonDMMF = getPhotonDMMF;
// Mostly used for tests
function getDMMF(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const dmmf = yield sdk_1.getDMMF(options);
        return getPhotonDMMF(dmmf);
    });
}
exports.getDMMF = getDMMF;
//# sourceMappingURL=getDMMF.js.map