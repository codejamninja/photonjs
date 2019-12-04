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
const enums_1 = require("../fixtures/enums");
const runtime_1 = require("../runtime");
const getDMMF_1 = require("../runtime/getDMMF");
chalk_1.default.level = 0;
describe('scalar where transformation', () => {
    let dmmf;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        dmmf = new runtime_1.DMMFClass(yield getDMMF_1.getDMMF({ datamodel: enums_1.enums }));
    }));
    test('transform correctly', () => {
        const select = {
            where: {
                AND: [
                    {
                        email: {
                            equals: 'a@a.de',
                            gt: '0',
                        },
                        AND: [
                            {
                                name: {
                                    equals: '5',
                                    not: '7',
                                },
                                OR: [
                                    {
                                        id: {
                                            not: '8',
                                            notIn: ['7'],
                                        },
                                    },
                                    {
                                        id: {
                                            not: '9',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        id: {
                            equals: '1',
                            gt: '0',
                        },
                    },
                ],
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
                                      findManyUser(where: {
                                        AND: [
                                          {
                                            email: {
                                              equals: \\"a@a.de\\"
                                              gt: \\"0\\"
                                            }
                                            AND: [
                                              {
                                                name: {
                                                  equals: \\"5\\"
                                                  not: \\"7\\"
                                                }
                                                OR: [
                                                  {
                                                    id: {
                                                      not: \\"8\\"
                                                      notIn: [\\"7\\"]
                                                    }
                                                  },
                                                  {
                                                    id: {
                                                      not: \\"9\\"
                                                    }
                                                  }
                                                ]
                                              }
                                            ]
                                          },
                                          {
                                            id: {
                                              equals: \\"1\\"
                                              gt: \\"0\\"
                                            }
                                          }
                                        ]
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
                                      findManyUser(where: {
                                        AND: [
                                          {
                                            email: \\"a@a.de\\"
                                            email_gt: \\"0\\"
                                            AND: [
                                              {
                                                name: \\"5\\"
                                                name_not: \\"7\\"
                                                OR: [
                                                  {
                                                    id_not: \\"8\\"
                                                    id_not_in: [\\"7\\"]
                                                  },
                                                  {
                                                    id_not: \\"9\\"
                                                  }
                                                ]
                                              }
                                            ]
                                          },
                                          {
                                            id: \\"1\\"
                                            id_gt: \\"0\\"
                                          }
                                        ]
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
    });
    test('MODELScalarWhereInput', () => {
        const select = {
            where: {
                AND: [
                    {
                        title: {
                            equals: 'a@a.de',
                            gt: '0',
                        },
                        AND: [
                            {
                                title: {
                                    equals: '5',
                                    not: '7',
                                },
                                OR: [
                                    {
                                        id: {
                                            not: '8',
                                        },
                                    },
                                    {
                                        id: {
                                            not: '9',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        id: {
                            equals: '1',
                            gt: '0',
                        },
                    },
                ],
            },
            data: {},
        };
        const document = runtime_1.makeDocument({
            dmmf,
            select,
            rootTypeName: 'mutation',
            rootField: 'updateManyPost',
        });
        expect(String(runtime_1.transformDocument(document))).toMatchInlineSnapshot(`
                                          "mutation {
                                            updateManyPost(
                                              where: {
                                                AND: [
                                                  {
                                                    title: {
                                                      \\"equals\\": \\"a@a.de\\",
                                                      \\"gt\\": \\"0\\"
                                                    }
                                                    AND: [
                                                      {
                                                        title: {
                                                          \\"equals\\": \\"5\\",
                                                          \\"not\\": \\"7\\"
                                                        }
                                                        OR: [
                                                          {
                                                            id_not: \\"8\\"
                                                          },
                                                          {
                                                            id_not: \\"9\\"
                                                          }
                                                        ]
                                                      }
                                                    ]
                                                  },
                                                  {
                                                    id: \\"1\\"
                                                    id_gt: \\"0\\"
                                                  }
                                                ]
                                              }
                                              data: {

                                              }
                                            ) {
                                              count
                                            }
                                          }"
                            `);
    });
    test('validate uuid scalar filter correctly', () => {
        const select = {
            where: {
                id: 'asd',
            },
        };
        const document = runtime_1.transformDocument(runtime_1.makeDocument({
            dmmf,
            select,
            rootTypeName: 'query',
            rootField: 'findManyTest',
        }));
        expect(String(document)).toMatchInlineSnapshot(`
                  "query {
                    findManyTest(where: {
                      id: \\"asd\\"
                    }) {
                      id
                      name
                    }
                  }"
            `);
        expect(() => document.validate(select, false, 'tests'))
            .toThrowErrorMatchingInlineSnapshot(`
"
Invalid \`photon.tests()\` invocation:

{
  where: {
    id: 'asd'
        ~~~~~
  }
}

Argument id: Got invalid value 'asd' on photon.findManyTest. Provided String, expected UUID or UUIDFilter.
type UUIDFilter {
  equals?: UUID
  not?: UUID | UUIDFilter
  in?: List<UUID>
  notIn?: List<UUID>
  lt?: UUID
  lte?: UUID
  gt?: UUID
  gte?: UUID
  contains?: UUID
  startsWith?: UUID
  endsWith?: UUID
}

"
`);
    });
});
//# sourceMappingURL=scalarWhereTransformation.test.js.map