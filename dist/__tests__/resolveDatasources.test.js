"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serializeDatasources_1 = require("../generation/serializeDatasources");
const resolveDatasources_1 = require("../utils/resolveDatasources");
const cwd = '/Users/tim/project/prisma';
const outputDir = '/Users/tim/project/node_modules/@generated/photon/runtime';
test('absolutizeRelativePath', () => {
    expect(resolveDatasources_1.absolutizeRelativePath('file:db.db', cwd, outputDir)).toMatchInlineSnapshot(`"'file:' + path.resolve(__dirname, '../../../../prisma/db.db')"`);
    expect(resolveDatasources_1.absolutizeRelativePath('file:/db.db', cwd, outputDir)).toMatchInlineSnapshot(`"'file:' + path.resolve(__dirname, '../../../../../../../db.db')"`);
    expect(resolveDatasources_1.absolutizeRelativePath('file:../db.db', cwd, outputDir)).toMatchInlineSnapshot(`"'file:' + path.resolve(__dirname, '../../../../db.db')"`);
    expect(resolveDatasources_1.absolutizeRelativePath('file:./db.db', cwd, outputDir)).toMatchInlineSnapshot(`"'file:' + path.resolve(__dirname, '../../../../prisma/db.db')"`);
    expect(resolveDatasources_1.absolutizeRelativePath('file:asd/another/dir/db.db', cwd, outputDir)).toMatchInlineSnapshot(`"'file:' + path.resolve(__dirname, '../../../../prisma/asd/another/dir/db.db')"`);
    expect(resolveDatasources_1.absolutizeRelativePath('file:/some/random/dir/db.db', cwd, outputDir)).toMatchInlineSnapshot(`"'file:' + path.resolve(__dirname, '../../../../../../../some/random/dir/db.db')"`);
    expect(resolveDatasources_1.absolutizeRelativePath('file:/Users/tim/project/node_modules/@generated/photon/runtime', cwd, outputDir)).toMatchInlineSnapshot(`"'file:' + path.resolve(__dirname, '')"`);
    expect(resolveDatasources_1.absolutizeRelativePath('file:../another-dir/db.db', cwd, outputDir)).toMatchInlineSnapshot(`"'file:' + path.resolve(__dirname, '../../../../another-dir/db.db')"`);
    expect(resolveDatasources_1.absolutizeRelativePath('file:./some/dir/db.db', cwd, outputDir)).toMatchInlineSnapshot(`"'file:' + path.resolve(__dirname, '../../../../prisma/some/dir/db.db')"`);
});
const datasources = [
    {
        name: 'db',
        url: {
            value: 'file:db.db',
            fromEnvVar: null,
        },
        connectorType: 'sqlite',
        config: {},
    },
    {
        name: 'db2',
        url: {
            value: 'file:./some-dir/db.db',
            fromEnvVar: null,
        },
        connectorType: 'sqlite',
        config: {},
    },
    {
        name: 'db3',
        url: {
            value: 'mysql:localhost',
            fromEnvVar: null,
        },
        connectorType: 'mysql',
        config: {},
    },
];
test('resolveDatasources', () => {
    expect(resolveDatasources_1.resolveDatasources(datasources, cwd, outputDir)).toMatchInlineSnapshot(`
    Array [
      Object {
        "config": Object {},
        "connectorType": "sqlite",
        "name": "db",
        "url": Object {
          "fromEnvVar": null,
          "value": "'file:' + path.resolve(__dirname, '../../../../prisma/db.db')",
        },
      },
      Object {
        "config": Object {},
        "connectorType": "sqlite",
        "name": "db2",
        "url": Object {
          "fromEnvVar": null,
          "value": "'file:' + path.resolve(__dirname, '../../../../prisma/some-dir/db.db')",
        },
      },
      Object {
        "config": Object {},
        "connectorType": "mysql",
        "name": "db3",
        "url": Object {
          "fromEnvVar": null,
          "value": "mysql:localhost",
        },
      },
    ]
  `);
});
test('serializeDatasources', () => {
    expect(serializeDatasources_1.serializeDatasources(resolveDatasources_1.resolveDatasources(datasources, cwd, outputDir).map(serializeDatasources_1.datasourceToDatasourceOverwrite)))
        .toMatchInlineSnapshot(`
    "[
      {
        \\"name\\": \\"db\\",
        \\"url\\": 'file:' + path.resolve(__dirname, '../../../../prisma/db.db')
      },
      {
        \\"name\\": \\"db2\\",
        \\"url\\": 'file:' + path.resolve(__dirname, '../../../../prisma/some-dir/db.db')
      },
      {
        \\"name\\": \\"db3\\",
        \\"url\\": \\"mysql:localhost\\"
      }
    ]"
  `);
});
//# sourceMappingURL=resolveDatasources.test.js.map