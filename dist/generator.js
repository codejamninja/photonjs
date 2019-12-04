#!/usr/bin/env ts-node
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
const generator_helper_1 = require("@prisma/generator-helper");
const debug_1 = __importDefault(require("debug"));
const generateClient_1 = require("./generation/generateClient");
const debug = debug_1.default('photon:generator');
const debugEnabled = debug_1.default.enabled('photon:generator');
// As specced in https://github.com/prisma/specs/tree/master/generators
generator_helper_1.generatorHandler({
    onManifest() {
        return {
            defaultOutput: '@prisma/photon',
            denylists: {
                models: [
                    'Enumerable',
                    'MergeTruthyValues',
                    'CleanupNever',
                    'AtLeastOne',
                    'OnlyOne',
                    'StringFilter',
                    'IDFilter',
                    'FloatFilter',
                    'IntFilter',
                    'BooleanFilter',
                    'DateTimeFilter',
                    'NullableStringFilter',
                    'NullableIDFilter',
                    'NullableFloatFilter',
                    'NullableIntFilter',
                    'NullableBooleanFilter',
                    'NullableDateTimeFilter',
                    'PhotonFetcher',
                    'Photon',
                    'Engine',
                    'PhotonOptions',
                ],
                fields: ['AND', 'OR', 'NOT'],
            },
            prettyName: 'Photon.js',
            requiresEngines: ['queryEngine'],
            version: require('../package.json').version,
        };
    },
    onGenerate(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (debugEnabled) {
                console.log('__dirname', __dirname);
                console.log(eval(`__dirname`)); // tslint:disable-line
            }
            return generateClient_1.generateClient({
                datamodel: options.datamodel,
                datamodelPath: options.schemaPath,
                binaryPaths: options.binaryPaths,
                datasources: options.datasources,
                outputDir: options.generator.output,
                copyRuntime: Boolean(options.generator.config.copyRuntime),
                dmmf: options.dmmf,
                generator: options.generator,
                version: options.version,
                transpile: true,
            });
        });
    },
});
//# sourceMappingURL=generator.js.map