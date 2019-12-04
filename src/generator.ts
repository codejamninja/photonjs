#!/usr/bin/env ts-node

import { generatorHandler } from '@prisma/generator-helper'
import Debug from 'debug'
import { generateClient } from './generation/generateClient'
const debug = Debug('photon:generator')
const debugEnabled = Debug.enabled('photon:generator')

// As specced in https://github.com/prisma/specs/tree/master/generators

generatorHandler({
  onManifest() {
    return {
      defaultOutput: '@prisma/photon', // the value here doesn't matter, as it's resolved in https://github.com/prisma/prisma2/blob/master/cli/sdk/src/getGenerators.ts
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
    }
  },
  async onGenerate(options) {
    if (debugEnabled) {
      console.log('__dirname', __dirname)
      console.log(eval(`__dirname`)) // tslint:disable-line
    }

    return generateClient({
      datamodel: options.datamodel,
      datamodelPath: options.schemaPath,
      binaryPaths: options.binaryPaths!,
      datasources: options.datasources,
      outputDir: options.generator.output!,
      copyRuntime: Boolean(options.generator.config.copyRuntime),
      dmmf: options.dmmf,
      generator: options.generator,
      version: options.version,
      transpile: true,
    })
  },
})
