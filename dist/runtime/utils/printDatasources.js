"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const indent_string_1 = __importDefault(require("indent-string"));
function printDatasources(dataSources, internalDatasources) {
    const mergedInternalDataSources = internalDatasources.map(internalDataSource => {
        const override = dataSources[internalDataSource.name];
        if (!override) {
            return internalDataSource;
        }
        if (typeof override === 'string') {
            return Object.assign(Object.assign({}, internalDataSource), { url: {
                    value: override,
                    fromEnvVar: null,
                } });
        }
        const { url } = override, rest = __rest(override, ["url"]);
        return Object.assign(Object.assign(Object.assign({}, internalDataSource), rest), { url: {
                value: override.url,
                fromEnvVar: null,
            } });
    });
    return mergedInternalDataSources.map(d => String(new InternalDataSourceClass(d))).join('\n\n');
}
exports.printDatasources = printDatasources;
const tab = 2;
class InternalDataSourceClass {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    toString() {
        const { dataSource } = this;
        const obj = {
            provider: dataSource.connectorType,
            url: dataSource.url,
        };
        if (dataSource.config && typeof dataSource.config === 'object') {
            Object.assign(obj, dataSource.config);
        }
        return `datasource ${dataSource.name} {
${indent_string_1.default(printDatamodelObject(obj), tab)}
}`;
    }
}
function printDatamodelObject(obj) {
    const maxLength = Object.keys(obj).reduce((max, curr) => Math.max(max, curr.length), 0);
    return Object.entries(obj)
        .map(([key, value]) => `${key.padEnd(maxLength)} = ${JSON.stringify(value)}`)
        .join('\n');
}
exports.printDatamodelObject = printDatamodelObject;
//# sourceMappingURL=printDatasources.js.map