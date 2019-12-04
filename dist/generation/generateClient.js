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
const copy_1 = __importDefault(require("@apexearth/copy"));
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const fs_1 = __importDefault(require("fs"));
const make_dir_1 = __importDefault(require("make-dir"));
const path_1 = __importDefault(require("path"));
const typescript_1 = require("typescript");
const util_1 = require("util");
const getDMMF_1 = require("../runtime/getDMMF");
const resolveDatasources_1 = require("../utils/resolveDatasources");
const extractSqliteSources_1 = require("./extractSqliteSources");
const TSClient_1 = require("./TSClient");
const debug = debug_1.default('generateClient');
debug.log = console.log.bind(console);
const remove = util_1.promisify(fs_1.default.unlink);
const writeFile = util_1.promisify(fs_1.default.writeFile);
const exists = util_1.promisify(fs_1.default.exists);
const copyFile = util_1.promisify(fs_1.default.copyFile);
function buildClient({ datamodel, schemaDir = process.cwd(), transpile = false, runtimePath = './runtime', browser = false, binaryPaths, outputDir, generator, version, dmmf, datasources, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileMap = {};
        const document = getDMMF_1.getPhotonDMMF(dmmf);
        const client = new TSClient_1.TSClient({
            document,
            runtimePath,
            browser,
            datasources: resolveDatasources_1.resolveDatasources(datasources, schemaDir, outputDir),
            sqliteDatasourceOverrides: extractSqliteSources_1.extractSqliteSources(datamodel, schemaDir, outputDir),
            generator,
            platforms: Object.keys(binaryPaths.queryEngine),
            version,
            schemaDir,
            outputDir,
        });
        const generatedClient = String(client);
        const target = '@generated/photon/index.ts';
        if (!transpile) {
            fileMap[target] = generatedClient;
            return {
                fileMap: normalizeFileMap(fileMap),
                photonDmmf: document,
            };
        }
        /**
         * If transpile === true, replace index.ts with index.js and index.d.ts
         * WARNING: This takes a long time
         * TODO: Implement transpilation as a separate code generator
         */
        const options = {
            module: typescript_1.ModuleKind.CommonJS,
            target: typescript_1.ScriptTarget.ES2016,
            lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
            declaration: true,
            strict: true,
            suppressOutputPathCheck: false,
            esModuleInterop: true,
        };
        const file = { fileName: target, content: generatedClient };
        const compilerHost = typescript_1.createCompilerHost(options);
        const originalGetSourceFile = compilerHost.getSourceFile;
        compilerHost.getSourceFile = fileName => {
            const newFileName = redirectToLib(fileName);
            if (fileName === file.fileName) {
                file.sourceFile =
                    file.sourceFile ||
                        typescript_1.createSourceFile(fileName, file.content, typescript_1.ScriptTarget.ES2015, true);
                return file.sourceFile;
            }
            return originalGetSourceFile.call(compilerHost, newFileName);
        };
        compilerHost.writeFile = (fileName, data) => {
            if (fileName.includes('@generated/photon') ||
                fileName.includes('@prisma/photon')) {
                fileMap[fileName] = data;
            }
        };
        const program = typescript_1.createProgram([file.fileName], options, compilerHost);
        const result = program.emit();
        if (result.diagnostics.length > 0) {
            console.log(chalk_1.default.redBright('Errors during Photon generation:'));
            console.log(result.diagnostics.map(d => d.messageText).join('\n'));
        }
        return {
            fileMap: normalizeFileMap(fileMap),
            photonDmmf: document,
        };
    });
}
exports.buildClient = buildClient;
function normalizeFileMap(fileMap) {
    return Object.entries(fileMap).reduce((acc, [key, value]) => {
        if (key.startsWith('@generated/photon/')) {
            acc[key.slice('@generated/photon/'.length)] = value;
        }
        else if (key.startsWith('@prisma/photon/')) {
            acc[key.slice('@prisma/photon/'.length)] = value;
        }
        return acc;
    }, {});
}
function generateClient({ datamodel, datamodelPath, schemaDir = datamodelPath ? path_1.default.dirname(datamodelPath) : process.cwd(), outputDir, transpile, runtimePath, browser, version = 'latest', generator, dmmf, datasources, binaryPaths, testMode, copyRuntime, }) {
    return __awaiter(this, void 0, void 0, function* () {
        runtimePath = runtimePath || './runtime';
        const { photonDmmf, fileMap } = yield buildClient({
            datamodel,
            datamodelPath,
            schemaDir,
            transpile,
            runtimePath,
            browser,
            outputDir,
            generator,
            version,
            dmmf,
            datasources,
            binaryPaths,
        });
        yield make_dir_1.default(outputDir);
        yield Promise.all(Object.entries(fileMap).map(([fileName, file]) => __awaiter(this, void 0, void 0, function* () {
            const filePath = path_1.default.join(outputDir, fileName);
            // The deletion of the file is necessary, so VSCode
            // picks up the changes.
            if (yield exists(filePath)) {
                yield remove(filePath);
            }
            yield writeFile(filePath, file);
        })));
        const inputDir = testMode
            ? eval(`require('path').join(__dirname, '../../runtime')`) // tslint:disable-line
            : eval(`require('path').join(__dirname, '../runtime')`); // tslint:disable-line
        // if users use a custom output dir
        if (copyRuntime ||
            !path_1.default.resolve(outputDir).endsWith(`@prisma${path_1.default.sep}photon`)) {
            // TODO: Windows, / is not working here...
            const copyTarget = path_1.default.join(outputDir, '/runtime');
            debug({ copyRuntime, outputDir, copyTarget, inputDir });
            if (inputDir !== copyTarget) {
                yield copy_1.default({
                    from: inputDir,
                    to: copyTarget,
                    recursive: true,
                    parallelJobs: process.platform === 'win32' ? 1 : 20,
                    overwrite: true,
                });
            }
        }
        if (!binaryPaths.queryEngine) {
            throw new Error(`Photon.js needs \`queryEngine\` in the \`binaryPaths\` object.`);
        }
        for (const filePath of Object.values(binaryPaths.queryEngine)) {
            const fileName = path_1.default.basename(filePath);
            const target = path_1.default.join(outputDir, 'runtime', fileName);
            debug(`Copying ${filePath} to ${target}`);
            yield copyFile(filePath, target);
        }
        const datamodelTargetPath = path_1.default.join(outputDir, 'schema.prisma');
        if (datamodelPath !== datamodelTargetPath) {
            yield copyFile(datamodelPath, datamodelTargetPath);
        }
        yield writeFile(path_1.default.join(outputDir, 'runtime/index.d.ts'), backup);
        return { photonDmmf, fileMap };
    });
}
exports.generateClient = generateClient;
const backup = `export { DMMF } from './dmmf-types'
// export { DMMFClass } from './dmmf'
// export { deepGet, deepSet } from './utils/deep-set'
// export { makeDocument, transformDocument } from './query'

export declare var Engine: any
export declare type Engine = any

// export declare var DMMF: any
// export declare type DMMF = any

export declare var DMMFClass: any
export declare type DMMFClass = any

export declare var deepGet: any
export declare type deepGet = any

export declare var chalk: any
export declare type chalk = any

export declare var deepSet: any
export declare type deepSet = any

export declare var makeDocument: any
export declare type makeDocument = any

export declare var transformDocument: any
export declare type transformDocument = any

export declare var debug: any
export declare type debug = any

export declare var debugLib: any
export declare type debugLib = any

export declare var InternalDatasource: any
export declare type InternalDatasource = any

export declare var Datasource: any
export declare type Datasource = any

export declare var printDatasources: any
export declare type printDatasources = any

export declare var printStack: any
export declare type printStack = any

export declare var mergeBy: any
export declare type mergeBy = any

export declare var unpack: any
export declare type unpack = any

export declare var getDMMF: any
export declare type getDMMF = any
`;
// This is needed because ncc rewrite some paths
function redirectToLib(fileName) {
    const file = path_1.default.basename(fileName);
    if (/^lib\.(.*?)\.d\.ts$/.test(file)) {
        if (!fs_1.default.existsSync(fileName)) {
            const dir = path_1.default.dirname(fileName);
            let newPath = path_1.default.join(dir, 'lib', file);
            if (!fs_1.default.existsSync(newPath)) {
                newPath = path_1.default.join(dir, 'typescript/lib', file);
            }
            return newPath;
        }
    }
    return fileName;
}
//# sourceMappingURL=generateClient.js.map