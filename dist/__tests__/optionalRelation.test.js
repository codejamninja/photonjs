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
describe('optional to one relation', () => {
    let dmmf;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        dmmf = new runtime_1.DMMFClass(yield getDMMF_1.getDMMF({ datamodel: blog_1.blog }));
    }));
    test('null query', () => {
        const select = {
            where: {
                author: null,
            },
        };
        const document = runtime_1.makeDocument({
            dmmf,
            select,
            rootTypeName: 'query',
            rootField: 'findManyPost',
        });
        expect(String(runtime_1.transformDocument(document))).toMatchInlineSnapshot(`
      "query {
        findManyPost(where: {
          author: null
        }) {
          id
          createdAt
          updatedAt
          published
          title
          content
        }
      }"
    `);
    });
});
//# sourceMappingURL=optionalRelation.test.js.map