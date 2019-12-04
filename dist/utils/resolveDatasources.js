"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
function resolveDatasources(datasources, cwd, outputDir) {
    return datasources.map(datasource => {
        if (datasource.connectorType === 'sqlite') {
            if (datasource.url.fromEnvVar === null) {
                return Object.assign(Object.assign({}, datasource), { url: {
                        fromEnvVar: null,
                        value: absolutizeRelativePath(datasource.url.value, cwd, outputDir),
                    } });
            }
            else {
                return datasource;
            }
        }
        return datasource;
    });
}
exports.resolveDatasources = resolveDatasources;
function absolutizeRelativePath(url, cwd, outputDir) {
    let filePath = url;
    if (filePath.startsWith('file:')) {
        filePath = filePath.slice(5);
    }
    const absoluteTarget = path_1.default.resolve(cwd, filePath);
    return `'file:' + path.resolve(__dirname, '${path_1.default.relative(outputDir, absoluteTarget)}')`;
}
exports.absolutizeRelativePath = absolutizeRelativePath;
//# sourceMappingURL=resolveDatasources.js.map