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
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const blog_1 = require("../fixtures/blog");
const dmmf_1 = require("../runtime/dmmf");
const query_1 = require("../runtime/query");
const getDMMF_1 = require("../runtime/getDMMF");
let dmmf;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const dmmfDocument = yield getDMMF_1.getDMMF({ datamodel: blog_1.blog });
    dmmf = new dmmf_1.DMMFClass(dmmfDocument);
}));
describe('include validation', () => {
    test('deep include query', () => {
        const ast = {
            include: {
                author: {
                    include: {
                        posts: true,
                    },
                },
            },
        };
        const document = query_1.makeDocument({
            dmmf,
            select: ast,
            rootTypeName: 'query',
            rootField: 'findManyPost',
        });
        expect(String(document)).toMatchSnapshot();
        expect(() => document.validate(ast)).not.toThrow();
    });
    test('dont allow empty include statements', () => {
        const ast = {
            include: {},
        };
        const document = query_1.makeDocument({
            dmmf,
            select: ast,
            rootTypeName: 'query',
            rootField: 'findManyPost',
        });
        expect(String(document)).toMatchSnapshot();
        try {
            document.validate(ast, false);
        }
        catch (e) {
            expect(strip_ansi_1.default(e.message)).toMatchInlineSnapshot(`
        "
        Invalid \`photon.findManyPost()\` invocation:

        {
          include: {
        ?   author?: true
          }
        }


        The \`include\` statement for type Post must not be empty. Available options are listed in green.
        "
      `);
        }
    });
    // Why do we allow it with include but not with select?
    // Very simple, because with select a statement with only false properties is useless
    // Why do we throw for an empty object? Also very simple: We want to help people to explore
    // the API through errors!
    test('allow include statement with only false properties', () => {
        const ast = {
            include: {
                author: true,
            },
        };
        const document = query_1.makeDocument({
            dmmf,
            select: ast,
            rootTypeName: 'query',
            rootField: 'findManyPost',
        });
        expect(String(document)).toMatchSnapshot();
        expect(() => document.validate(ast)).not.toThrow();
    });
    test('allow deep include without another include', () => {
        const ast = {
            include: {
                posts: { first: 20 },
            },
        };
        const document = query_1.makeDocument({
            dmmf,
            select: ast,
            rootTypeName: 'query',
            rootField: 'findManyUser',
        });
        expect(String(document)).toMatchSnapshot();
        expect(() => document.validate(ast)).not.toThrow();
    });
    test('handle scalar fields special', () => {
        const ast = {
            include: {
                id: true,
            },
        };
        const document = query_1.makeDocument({
            dmmf,
            select: ast,
            rootTypeName: 'query',
            rootField: 'findManyPost',
        });
        expect(String(document)).toMatchSnapshot();
        try {
            document.validate(ast, false);
        }
        catch (e) {
            expect(strip_ansi_1.default(e.message)).toMatchInlineSnapshot(`
                "
                Invalid \`photon.id()\` invocation:

                {
                  include: {
                    id: true,
                    ~~
                ?   author?: true
                  }
                }


                Invalid scalar field \`id\` for include statement on model Post. Available options are listed in green.
                Note, that include statements only accept relation fields.
                "
            `);
        }
    });
    test('catch unknown field name', () => {
        const ast = {
            include: {
                mauthor: true,
            },
        };
        const document = query_1.makeDocument({
            dmmf,
            select: ast,
            rootTypeName: 'query',
            rootField: 'findManyPost',
        });
        expect(String(document)).toMatchSnapshot();
        try {
            document.validate(ast, false);
        }
        catch (e) {
            expect(strip_ansi_1.default(e.message)).toMatchInlineSnapshot(`
                        "
                        Invalid \`photon.mauthor()\` invocation:

                        {
                          include: {
                            mauthor: true,
                            ~~~~~~~
                        ?   author?: true
                          }
                        }


                        Unknown field \`mauthor\` for include statement on model Post. Available options are listed in green. Did you mean \`author\`?
                        "
                  `);
        }
    });
});
//# sourceMappingURL=include.test.js.map