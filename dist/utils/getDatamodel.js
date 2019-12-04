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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const readFile = util_1.promisify(fs_1.default.readFile);
const exists = util_1.promisify(fs_1.default.exists);
function getDatamodelPath(cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        let datamodelPath = path_1.default.join(cwd, 'schema.prisma');
        if (!(yield exists(datamodelPath))) {
            datamodelPath = path_1.default.join(cwd, 'prisma/schema.prisma');
        }
        if (!(yield exists(datamodelPath))) {
            throw new Error(`Could not find ${datamodelPath}`);
        }
        return datamodelPath;
    });
}
exports.getDatamodelPath = getDatamodelPath;
function getDatamodel(cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        const datamodelPath = yield getDatamodelPath(cwd);
        return readFile(datamodelPath, 'utf-8');
    });
}
exports.getDatamodel = getDatamodel;
//# sourceMappingURL=getDatamodel.js.map