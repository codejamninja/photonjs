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
const enums_1 = require("../fixtures/enums");
const runtime_1 = require("../runtime");
const getDMMF_1 = require("../runtime/getDMMF");
describe('where transformation', () => {
    let dmmf;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        dmmf = new runtime_1.DMMFClass(yield getDMMF_1.getDMMF({ datamodel: enums_1.enums }));
    }));
    test('transform correctly', () => {
        const select = {
            orderBy: {
                email: 'asc',
            },
        };
        const document = runtime_1.makeDocument({
            dmmf,
            select,
            rootTypeName: 'query',
            rootField: 'findManyUser',
        });
        expect(String(document)).toMatchInlineSnapshot(`
      "query {
        findManyUser(orderBy: {
          email: asc
        }) {
          id
          name
          email
          status
          nicknames
          permissions
          favoriteTree
        }
      }"
    `);
        expect(String(runtime_1.transformDocument(document))).toMatchInlineSnapshot(`
      "query {
        findManyUser(orderBy: email_ASC) {
          id
          name
          email
          status
          nicknames
          permissions
          favoriteTree
        }
      }"
    `);
    });
    test('throw when 2 order by args provided', () => {
        const select = {
            orderBy: {
                email: 'asc',
                id: 'asc',
            },
        };
        const document = runtime_1.makeDocument({
            dmmf,
            select,
            rootTypeName: 'query',
            rootField: 'findManyUser',
        });
        expect(String(document)).toMatchInlineSnapshot(`
      "query {
        findManyUser(orderBy: {
          email: asc
          id: asc
        }) {
          id
          name
          email
          status
          nicknames
          permissions
          favoriteTree
        }
      }"
    `);
        expect(String(runtime_1.transformDocument(document))).toMatchInlineSnapshot(`
      "query {
        findManyUser(orderBy: email_ASC) {
          id
          name
          email
          status
          nicknames
          permissions
          favoriteTree
        }
      }"
    `);
        try {
            document.validate(select, false, 'users');
        }
        catch (e) {
            expect(strip_ansi_1.default(e.message)).toMatchInlineSnapshot(`
                "
                Invalid \`photon.users()\` invocation:

                {
                  orderBy: {
                    email: 'asc',
                    id: 'asc'
                  }
                  ~~~~~~~~~~~~~~~
                }

                Argument orderBy of type UserOrderByInput needs exactly one argument, but you provided email and id. Please choose one. Available args: 
                type UserOrderByInput {
                  id?: OrderByArg
                  name?: OrderByArg
                  email?: OrderByArg
                  status?: OrderByArg
                  favoriteTree?: OrderByArg
                }

                "
            `);
        }
    });
});
//# sourceMappingURL=orderTransformation.test.js.map