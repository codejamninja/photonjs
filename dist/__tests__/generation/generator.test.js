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
const sdk_1 = require("@prisma/sdk");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const omit_1 = require("../../omit");
jest.setTimeout(10000);
describe('generator', () => {
    test('minimal', () => __awaiter(void 0, void 0, void 0, function* () {
        const photonTarget = path_1.default.join(__dirname, './node_modules/@prisma/photon');
        yield sdk_1.getPackedPackage('@prisma/photon', photonTarget);
        if (!fs_1.default.existsSync(photonTarget)) {
            throw new Error(`Photon didn't get packed properly 🤔`);
        }
        const generator = yield sdk_1.getGenerator({
            schemaPath: path_1.default.join(__dirname, 'schema.prisma'),
            baseDir: __dirname,
            printDownloadProgress: false,
            skipDownload: true,
        });
        expect(omit_1.omit(generator.manifest, ['version'])).toMatchInlineSnapshot(`
      Object {
        "defaultOutput": "@prisma/photon",
        "denylists": Object {
          "fields": Array [
            "AND",
            "OR",
            "NOT",
          ],
          "models": Array [
            "Enumerable",
            "MergeTruthyValues",
            "CleanupNever",
            "AtLeastOne",
            "OnlyOne",
            "StringFilter",
            "IDFilter",
            "FloatFilter",
            "IntFilter",
            "BooleanFilter",
            "DateTimeFilter",
            "NullableStringFilter",
            "NullableIDFilter",
            "NullableFloatFilter",
            "NullableIntFilter",
            "NullableBooleanFilter",
            "NullableDateTimeFilter",
            "PhotonFetcher",
            "Photon",
            "Engine",
            "PhotonOptions",
          ],
        },
        "prettyName": "Photon.js",
        "requiresEngines": Array [
          "queryEngine",
        ],
      }
    `);
        expect(omit_1.omit(generator.options.generator, ['output']))
            .toMatchInlineSnapshot(`
                                    Object {
                                      "binaryTargets": Array [],
                                      "config": Object {},
                                      "name": "photon",
                                      "provider": "photonjs",
                                    }
                        `);
        expect(path_1.default.relative(__dirname, generator.options.generator.output)).toMatchInlineSnapshot(`"node_modules/@prisma/photon"`);
        yield generator.generate();
        const photonDir = path_1.default.join(__dirname, 'node_modules/@prisma/photon');
        expect(fs_1.default.existsSync(photonDir)).toBe(true);
        expect(fs_1.default.existsSync(path_1.default.join(photonDir, 'index.js'))).toBe(true);
        expect(fs_1.default.existsSync(path_1.default.join(photonDir, 'index.d.ts'))).toBe(true);
        expect(fs_1.default.existsSync(path_1.default.join(photonDir, 'runtime'))).toBe(true);
        generator.stop();
    }));
    test.skip('inMemory', () => __awaiter(void 0, void 0, void 0, function* () {
        const generator = yield sdk_1.getGenerator({
            schemaPath: path_1.default.join(__dirname, 'schema.prisma'),
            providerAliases: {
                photonjs: {
                    generatorPath: path_1.default.join(__dirname, '../../../dist/generator.js'),
                    outputPath: __dirname,
                },
            },
            baseDir: __dirname,
            overrideGenerators: [
                {
                    binaryTargets: [],
                    config: {
                        inMemory: 'true',
                    },
                    name: 'photon',
                    provider: 'photonjs',
                    output: null,
                },
            ],
            skipDownload: true,
        });
        const result = yield generator.generate();
        expect(Object.keys(result.fileMap)).toMatchInlineSnapshot(`
            Array [
              "index.js",
              "index.d.ts",
            ]
        `);
        expect(Object.keys(result.photonDmmf)).toMatchInlineSnapshot(`
                  Array [
                    "datamodel",
                    "mappings",
                    "schema",
                  ]
            `);
        generator.stop();
    }));
});
//# sourceMappingURL=generator.test.js.map