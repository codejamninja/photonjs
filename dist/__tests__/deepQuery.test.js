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
const chalk_1 = __importDefault(require("chalk"));
const recommender_1 = require("../fixtures/recommender");
const runtime_1 = require("../runtime");
const getDMMF_1 = require("../runtime/getDMMF");
chalk_1.default.level = 0;
let dmmf;
describe('minimal where transformation', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        dmmf = new runtime_1.DMMFClass(yield getDMMF_1.getDMMF({ datamodel: recommender_1.recommender }));
    }));
    test('OR posts some id in', () => {
        const transformedDocument = getTransformedDocument({
            where: {
                likedArticles: {
                    some: {
                        likedBy: {
                            some: {
                                AND: {
                                    likedArticles: {
                                        some: {
                                            likedBy: {
                                                some: {
                                                    likedArticles: {
                                                        some: {
                                                            title: {
                                                                contains: 'A string',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        expect(transformedDocument).toMatchInlineSnapshot(`
      "query {
        findManyUser(where: {
          likedArticles_some: {
            likedBy_some: {
              AND: [
                {
                  likedArticles_some: {
                    likedBy_some: {
                      likedArticles_some: {
                        title_contains: \\"A string\\"
                      }
                    }
                  }
                }
              ]
            }
          }
        }) {
          id
          name
          email
        }
      }"
    `);
    });
});
function getTransformedDocument(select) {
    const document = runtime_1.makeDocument({
        dmmf,
        select,
        rootTypeName: 'query',
        rootField: 'findManyUser',
    });
    return String(runtime_1.transformDocument(document));
}
//# sourceMappingURL=deepQuery.test.js.map