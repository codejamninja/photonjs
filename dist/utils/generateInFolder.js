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
const get_platform_1 = require("@prisma/get-platform");
const sdk_1 = require("@prisma/sdk");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const perf_hooks_1 = require("perf_hooks");
const generateClient_1 = require("../generation/generateClient");
const sdk_2 = require("@prisma/sdk");
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('generateInFolder');
function generateInFolder({ projectDir, useLocalRuntime = false, transpile = true, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const before = perf_hooks_1.performance.now();
        if (!projectDir) {
            throw new Error(`Project dir missing. Usage: ts-node examples/generate.ts examples/accounts`);
        }
        if (!fs_1.default.existsSync(projectDir)) {
            throw new Error(`Path ${projectDir} does not exist`);
        }
        const schemaPath = getSchemaPath(projectDir);
        const datamodel = fs_1.default.readFileSync(schemaPath, 'utf-8');
        const dmmf = yield sdk_1.getDMMF({ datamodel });
        const config = yield sdk_1.getConfig({ datamodel });
        const outputDir = path_1.default.join(projectDir, 'node_modules/@prisma/photon');
        yield sdk_2.getPackedPackage('@prisma/photon', outputDir);
        const platform = yield get_platform_1.getPlatform();
        yield generateClient_1.generateClient(Object.assign(Object.assign({ binaryPaths: {
                queryEngine: {
                    [platform]: path_1.default.join(__dirname, `../../query-engine-${platform}${platform === 'windows' ? '.exe' : ''}`),
                },
            }, datamodel,
            dmmf }, config), { outputDir, schemaDir: path_1.default.dirname(schemaPath), runtimePath: useLocalRuntime
                ? path_1.default.relative(outputDir, path_1.default.join(__dirname, '../runtime'))
                : undefined, transpile, testMode: true, datamodelPath: schemaPath, copyRuntime: false }));
        const time = perf_hooks_1.performance.now() - before;
        debug(`Done generating client in ${time}`);
        return time;
    });
}
exports.generateInFolder = generateInFolder;
function getSchemaPath(projectDir) {
    if (fs_1.default.existsSync(path_1.default.join(projectDir, 'schema.prisma'))) {
        return path_1.default.join(projectDir, 'schema.prisma');
    }
    if (fs_1.default.existsSync(path_1.default.join(projectDir, 'prisma/schema.prisma'))) {
        return path_1.default.join(projectDir, 'prisma/schema.prisma');
    }
    throw new Error(`Could not find any schema.prisma in ${projectDir} or sub directories.`);
}
//# sourceMappingURL=generateInFolder.js.map