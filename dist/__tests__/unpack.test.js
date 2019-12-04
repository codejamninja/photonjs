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
Object.defineProperty(exports, "__esModule", { value: true });
const blog_1 = require("../fixtures/blog");
const runtime_1 = require("../runtime");
const query_1 = require("../runtime/query");
const getDMMF_1 = require("../runtime/getDMMF");
let dmmf;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const dmmfObj = yield getDMMF_1.getDMMF({
        datamodel: blog_1.blog,
    });
    dmmf = new runtime_1.DMMFClass(dmmfObj);
}));
describe('getField', () => {
    test('blog findOneUser', () => __awaiter(void 0, void 0, void 0, function* () {
        const document = query_1.makeDocument({
            dmmf,
            select: {
                select: {
                    id: true,
                    posts: true,
                },
            },
            rootTypeName: 'query',
            rootField: 'findOneUser',
        });
        expect(query_1.getField(document, ['findOneUser']).name).toMatchInlineSnapshot(`"findOneUser"`);
        expect(query_1.getField(document, ['findOneUser', 'id']).name).toMatchInlineSnapshot(`"id"`);
        expect(query_1.getField(document, ['findOneUser', 'posts']).name).toMatchInlineSnapshot(`"posts"`);
        expect(query_1.getField(document, ['findOneUser', 'posts', 'title']).name).toMatchInlineSnapshot(`"title"`);
    }));
});
describe('unpack', () => {
    test('findOnePost', () => __awaiter(void 0, void 0, void 0, function* () {
        const document = query_1.makeDocument({
            dmmf,
            select: {
            // select: {
            //   id: true,
            //   posts: true,
            // },
            },
            rootTypeName: 'query',
            rootField: 'findOnePost',
        });
        const path = ['findOnePost'];
        const data = {
            findOnePost: {
                id: 'some-id',
                createdAt: '2019-10-17T09:56:37.690Z',
                updatedAt: '2019-10-17T09:56:37.690Z',
                published: false,
                title: 'Some mighty hightly title',
            },
        };
        const result = query_1.unpack({
            document,
            path,
            data,
        });
        expect(result.createdAt instanceof Date).toBe(true);
        expect(result.updatedAt instanceof Date).toBe(true);
        expect(result).toMatchInlineSnapshot(`
      Object {
        "createdAt": 2019-10-17T09:56:37.690Z,
        "id": "some-id",
        "published": false,
        "title": "Some mighty hightly title",
        "updatedAt": 2019-10-17T09:56:37.690Z,
      }
    `);
    }));
    test('findManyPost', () => __awaiter(void 0, void 0, void 0, function* () {
        const document = query_1.makeDocument({
            dmmf,
            select: {},
            rootTypeName: 'query',
            rootField: 'findManyPost',
        });
        const path = ['findManyPost'];
        const data = {
            findManyPost: [
                {
                    id: 'some-id',
                    createdAt: '2019-10-17T09:56:37.690Z',
                    updatedAt: '2019-10-17T09:56:37.690Z',
                    published: false,
                    title: 'Some mighty hightly title',
                },
                {
                    id: 'some-id2',
                    createdAt: '2019-11-17T09:56:37.690Z',
                    updatedAt: '2019-11-17T09:56:37.690Z',
                    published: true,
                    title: 'Having a title that is recital is just vital',
                },
                {
                    id: 'some-id3',
                    createdAt: '2019-11-17T09:56:37.690Z',
                    updatedAt: '2019-11-17T09:56:37.690Z',
                    published: true,
                    title: "One thing for sure: If you don't read the bible, you can't belong to the tribal.",
                },
            ],
        };
        const result = query_1.unpack({
            document,
            path,
            data,
        });
        expect(result[0].createdAt instanceof Date).toBe(true);
        expect(result[0].updatedAt instanceof Date).toBe(true);
        expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "createdAt": 2019-10-17T09:56:37.690Z,
          "id": "some-id",
          "published": false,
          "title": "Some mighty hightly title",
          "updatedAt": 2019-10-17T09:56:37.690Z,
        },
        Object {
          "createdAt": 2019-11-17T09:56:37.690Z,
          "id": "some-id2",
          "published": true,
          "title": "Having a title that is recital is just vital",
          "updatedAt": 2019-11-17T09:56:37.690Z,
        },
        Object {
          "createdAt": 2019-11-17T09:56:37.690Z,
          "id": "some-id3",
          "published": true,
          "title": "One thing for sure: If you don't read the bible, you can't belong to the tribal.",
          "updatedAt": 2019-11-17T09:56:37.690Z,
        },
      ]
    `);
    }));
    test('findOneUser', () => __awaiter(void 0, void 0, void 0, function* () {
        const document = query_1.makeDocument({
            dmmf,
            select: {
                include: {
                    posts: true,
                },
            },
            rootTypeName: 'query',
            rootField: 'findOneUser',
        });
        const path = ['findOneUser'];
        const data = {
            findOneUser: {
                id: 'some-id',
                email: 'a@a.com',
                posts: [
                    {
                        id: 'some-id',
                        createdAt: '2019-10-17T09:56:37.690Z',
                        updatedAt: '2019-10-17T09:56:37.690Z',
                        published: false,
                        title: 'Some mighty hightly title',
                    },
                    {
                        id: 'some-id2',
                        createdAt: '2019-11-17T09:56:37.690Z',
                        updatedAt: '2019-11-17T09:56:37.690Z',
                        published: true,
                        title: 'Having a title that is recital is just vital',
                    },
                    {
                        id: 'some-id3',
                        createdAt: '2019-11-17T09:56:37.690Z',
                        updatedAt: '2019-11-17T09:56:37.690Z',
                        published: true,
                        title: 'Does the bible talk about the revival of the tribal?',
                    },
                ],
            },
        };
        const result = query_1.unpack({
            document,
            path,
            data,
        });
        expect(result).toMatchInlineSnapshot(`
      Object {
        "email": "a@a.com",
        "id": "some-id",
        "posts": Array [
          Object {
            "createdAt": 2019-10-17T09:56:37.690Z,
            "id": "some-id",
            "published": false,
            "title": "Some mighty hightly title",
            "updatedAt": 2019-10-17T09:56:37.690Z,
          },
          Object {
            "createdAt": 2019-11-17T09:56:37.690Z,
            "id": "some-id2",
            "published": true,
            "title": "Having a title that is recital is just vital",
            "updatedAt": 2019-11-17T09:56:37.690Z,
          },
          Object {
            "createdAt": 2019-11-17T09:56:37.690Z,
            "id": "some-id3",
            "published": true,
            "title": "Does the bible talk about the revival of the tribal?",
            "updatedAt": 2019-11-17T09:56:37.690Z,
          },
        ],
      }
    `);
    }));
});
//# sourceMappingURL=unpack.test.js.map