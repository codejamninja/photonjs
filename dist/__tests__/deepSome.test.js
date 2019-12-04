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
const blog_1 = require("../fixtures/blog");
const runtime_1 = require("../runtime");
const getDMMF_1 = require("../runtime/getDMMF");
chalk_1.default.level = 0;
let dmmf;
describe('minimal where transformation', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        dmmf = new runtime_1.DMMFClass(yield getDMMF_1.getDMMF({ datamodel: blog_1.blog }));
    }));
    test('OR posts some id in', () => {
        const transformedDocument = getTransformedDocument({
            where: {
                posts: {
                    some: {
                        author: {
                            posts: {
                                some: {
                                    author: {
                                        posts: {
                                            some: {
                                                id: '5',
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
          posts_some: {
            author: {
              posts_some: {
                author: {
                  posts_some: {
                    id: \\"5\\"
                  }
                }
              }
            }
          }
        }) {
          id
          email
          name
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
//# sourceMappingURL=deepSome.test.js.map