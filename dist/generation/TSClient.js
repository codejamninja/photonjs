"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("flat-map-polyfill"); // unfortunately needed as it's not properly polyfilled in TypeScript
const indent_string_1 = __importDefault(require("indent-string"));
const dmmf_1 = require("../runtime/dmmf");
const dmmf_types_1 = require("../runtime/dmmf-types");
const common_1 = require("../runtime/utils/common");
const serializeDatasources_1 = require("./serializeDatasources");
const utils_1 = require("./utils");
const tab = 2;
const commonCode = (runtimePath, version) => `import {
  DMMF,
  DMMFClass,
  deepGet,
  deepSet,
  makeDocument,
  Engine,
  debugLib,
  transformDocument,
  chalk,
  printStack,
  mergeBy,
  unpack
} from '${runtimePath}'

/**
 * Query Engine version: ${version || 'latest'}
 */

import path = require('path')
import fs = require('fs')

const debug = debugLib('photon')

/**
 * Utility Types
 */


export type Enumerable<T> = T | Array<T>

export type MergeTruthyValues<R extends object, S extends object> = {
  [key in keyof S | keyof R]: key extends false
    ? never
    : key extends keyof S
    ? S[key] extends false
      ? never
      : S[key]
    : key extends keyof R
    ? R[key]
    : never
}

export type CleanupNever<T> = { [key in keyof T]: T[key] extends never ? never : key }[keyof T]

/**
 * Subset
 * @desc From \`T\` pick properties that exist in \`U\`. Simple version of Intersection
 */
export type Subset<T, U> = { [key in keyof T]: key extends keyof U ? T[key] : never }

class PhotonFetcher {
  constructor(
    private readonly photon: Photon,
    private readonly engine: Engine,
    private readonly debug = false,
    private readonly hooks?: Hooks
  ) {}
  async request<T>(document: any, path: string[] = [], rootField?: string, typeName?: string, isList?: boolean, callsite?: string): Promise<T> {
    const query = String(document)
    debug('Request:')
    debug(query)
    if (this.hooks && this.hooks.beforeRequest) {
      this.hooks.beforeRequest({ query, path, rootField, typeName, document })
    }
    try {
      await this.photon.connect()
      const result = await this.engine.request(query, typeName)
      debug('Response:')
      debug(result)
      return this.unpack(document, result, path, rootField, isList)
    } catch (e) {
      if (callsite) {
        const { stack } = printStack({
          callsite,
          originalMethod: path.join('.'),
          onUs: e.isPanic
        })
        throw new Error(stack + '\\n\\n' + e.message)
      } else {
        if (e.isPanic) {
          throw e
        } else {
          throw new Error(\`Error in Photon\${path}: \\n\` + e.stack)
        }
      }
    }
  }
  protected unpack(document: any, data: any, path: string[], rootField?: string, isList?: boolean) {
    const getPath: string[] = []
    if (rootField) {
      getPath.push(rootField)
    }
    getPath.push(...path.filter(p => p !== 'select' && p !== 'include'))
    return unpack({ document, path: getPath, data })
  }
}
`;
class TSClient {
    constructor({ document, runtimePath, browser = false, datasources, generator, platforms, sqliteDatasourceOverrides, schemaDir, outputDir, }) {
        this.document = document;
        this.runtimePath = runtimePath;
        this.browser = browser;
        this.internalDatasources = datasources;
        this.generator = generator;
        this.platforms = platforms;
        this.sqliteDatasourceOverrides = sqliteDatasourceOverrides;
        // We make a deep clone here as otherwise we would serialize circular references
        // which we're building up in the DMMFClass
        this.dmmf = new dmmf_1.DMMFClass(JSON.parse(JSON.stringify(document)));
        this.schemaDir = schemaDir;
        this.outputDir = outputDir;
    }
    toString() {
        return `${commonCode(this.runtimePath, this.version)}

/**
 * Build tool annotations
 * In order to make \`ncc\` and \`node-file-trace\` happy.
**/

${this.platforms
            ? this.platforms
                .map(p => `path.join(__dirname, 'runtime/query-engine-${p}');`)
                .join('\n')
            : ''}

/**
 * Client
**/

${new PhotonClientClass(this.dmmf, this.internalDatasources, this.outputDir, this.browser, this.generator, this.sqliteDatasourceOverrides, this.schemaDir)}

${ /*new Query(this.dmmf, 'query')*/''}

/**
 * Enums
 */

// Based on
// https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

function makeEnum<T extends {[index: string]: U}, U extends string>(x: T) { return x }

${this.dmmf.schema.enums.map(type => new Enum(type)).join('\n\n')}

${Object.values(this.dmmf.modelMap)
            .map(model => new Model(model, this.dmmf))
            .join('\n')}

/**
 * Deep Input Types
 */

${this.dmmf.inputTypes.map(inputType => new InputType(inputType)).join('\n')}

/**
 * Batch Payload for updateMany & deleteMany
 */

export type BatchPayload = {
  count: number
}

/**
 * DMMF
 */

export const dmmf: DMMF.Document = ${JSON.stringify(this.document)}
    `;
    }
}
exports.TSClient = TSClient;
class Datasources {
    constructor(internalDatasources) {
        this.internalDatasources = internalDatasources;
    }
    toString() {
        const sources = this.internalDatasources;
        return `export type Datasources = {
${indent_string_1.default(sources.map(s => `${s.name}?: string`).join('\n'), 2)}
}`;
    }
}
class PhotonClientClass {
    constructor(dmmf, internalDatasources, outputDir, browser, generator, sqliteDatasourceOverrides, cwd) {
        this.dmmf = dmmf;
        this.internalDatasources = internalDatasources;
        this.outputDir = outputDir;
        this.browser = browser;
        this.generator = generator;
        this.sqliteDatasourceOverrides = sqliteDatasourceOverrides;
        this.cwd = cwd;
    }
    toString() {
        const { dmmf } = this;
        return `
${new Datasources(this.internalDatasources)}

export type LogLevel = 'INFO' | 'WARN' | 'QUERY' 

export type LogOption = LogLevel | {
  level: LogLevel
  /**
   * @default 'stdout'
   */
  emit?: 'event' | 'stdout'
}

export interface PhotonOptions {
  datasources?: Datasources

  /**
   * @default false
   */
  log?: boolean | LogOption[]

  debug?: any

  /**
   * You probably don't want to use this. \`__internal\` is used by internal tooling.
   */
  __internal?: {
    debug?: boolean
    hooks?: Hooks
    engine?: {
      cwd?: string
      binaryPath?: string
    }
  }
}

export type Hooks = {
  beforeRequest?: (options: {query: string, path: string[], rootField?: string, typeName?: string, document: any}) => any
}

export class Photon {
  private fetcher: PhotonFetcher
  private readonly dmmf: DMMFClass
  private readonly engine: Engine
  private connectionPromise?: Promise<any>
  constructor(options: PhotonOptions = {}) {
    const useDebug = options.debug === true ? true : typeof options.debug === 'object' ? Boolean(options.debug.library) : false
    if (useDebug) {
      debugLib.enable('photon')
    }
    const debugEngine = options.debug === true ? true : typeof options.debug === 'object' ? Boolean(options.debug.engine) : false

    // datamodel = datamodel without datasources + printed datasources

    const predefinedDatasources = ${this.sqliteDatasourceOverrides
            ? utils_1.indentAllButFirstLine(serializeDatasources_1.serializeDatasources(this.sqliteDatasourceOverrides), 4)
            : '[]'}
    const inputDatasources = Object.entries(options.datasources || {}).map(([name, url]) => ({ name, url: url! }))

    const datasources = mergeBy(predefinedDatasources, inputDatasources, (source: any) => source.name)

    const internal = options.__internal || {}
    const engineConfig = internal.engine || {}

    this.engine = new Engine({
      cwd: engineConfig.cwd || ${utils_1.getRelativePathResolveStatement(this.outputDir, this.cwd)},
      debug: debugEngine,
      datamodelPath: path.resolve(__dirname, 'schema.prisma'),
      prismaPath: engineConfig.binaryPath || undefined,
      datasources,
      generator: ${this.generator ? JSON.stringify(this.generator) : 'undefined'},
    })

    this.dmmf = new DMMFClass(dmmf)
    this.fetcher = new PhotonFetcher(this, this.engine, false, internal.hooks)
  }
  private async connectEngine(publicCall?: boolean) {
    return this.engine.start()
  }
  connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise
    }
    this.connectionPromise = this.connectEngine(true)
    return this.connectionPromise!
  }
  async disconnect() {
    await this.engine.stop()
  }
  // won't be generated for now
  // private _query?: QueryDelegate
  // get query(): QueryDelegate {
  //   return this._query ? this._query: (this._query = QueryDelegate(this.dmmf, this.fetcher))
  // }
${indent_string_1.default(dmmf.mappings
            .filter(m => m.findMany)
            .map(m => `
get ${m.plural}(): ${m.model}Delegate {
  return ${m.model}Delegate(this.dmmf, this.fetcher)
}`)
            .join('\n'), 2)}
}
`;
    }
}
class QueryPayloadType {
    constructor(type) {
        this.type = type;
    }
    toString() {
        const { type } = this;
        const { name } = type;
        const relationFields = type.fields.filter(f => f.outputType.kind === 'object' && f.name !== 'node');
        const relationFieldConditions = relationFields.length === 0
            ? ''
            : `\n${relationFields
                .map(f => indent_string_1.default(`: P extends '${f.name}'\n? ${this.wrapArray(f, `${utils_1.getPayloadName(f.outputType.type.name, utils_1.Projection.select)}<Extract${utils_1.getModelArgName(f.outputType.type.name, utils_1.Projection.select, f.outputType.isList
                ? dmmf_types_1.DMMF.ModelAction.findMany
                : dmmf_types_1.DMMF.ModelAction.findOne)}<S[P]>>`)}`, 8))
                .join('\n')}`;
        return `\
type ${utils_1.getPayloadName(name, utils_1.Projection.select)}<S extends ${name}Args> = S extends ${name}Args
  ? {
      [P in keyof S] ${relationFieldConditions}
        : never
    } : never
  `;
    }
    wrapArray(field, str) {
        if (field.outputType.isList) {
            return `Array<${str}>`;
        }
        return str;
    }
}
/**
 * Generates the generic type to calculate a payload based on a include statement
 */
class PayloadType {
    constructor(type, projection) {
        this.type = type;
        this.projection = projection;
    }
    toString() {
        const { type, projection } = this;
        const { name } = type;
        const relationFields = type.fields.filter(f => f.outputType.kind === 'object');
        const relationFieldConditions = relationFields.length === 0
            ? ''
            : `\n${relationFields
                .map(f => indent_string_1.default(`: P extends '${f.name}'\n? ${this.wrapArray(f, `${utils_1.getPayloadName(f.outputType.type.name, projection)}<Extract${utils_1.getFieldArgName(f, projection)}<S[P]>>${!f.outputType.isRequired && !f.outputType.isList
                ? ' | null'
                : ''}`)}`, 8))
                .join('\n')}`;
        const hasScalarFields = type.fields.filter(f => f.outputType.kind !== 'object').length > 0;
        const projectionName = projection === utils_1.Projection.select
            ? utils_1.getSelectName(name)
            : utils_1.getIncludeName(name);
        return `\
type ${utils_1.getPayloadName(name, projection)}<S extends boolean | ${projectionName}> = S extends true
  ? ${name}
  : S extends ${projectionName}
  ? {
      [P in CleanupNever<MergeTruthyValues<${projection === utils_1.Projection.select ? '{}' : utils_1.getDefaultName(name)}, S>>]${hasScalarFields
            ? `: P extends ${utils_1.getScalarsName(name)}
        ? ${name}[P]`
            : ''}${relationFieldConditions}
        : never
    }
   : never`;
    }
    wrapArray(field, str) {
        if (field.outputType.isList) {
            return `Array<${str}>`;
        }
        return str;
    }
}
/**
 * Generates the default selection of a model
 */
class ModelDefault {
    constructor(model, dmmf) {
        this.model = model;
        this.dmmf = dmmf;
    }
    toString() {
        const { model } = this;
        return `\
type ${utils_1.getDefaultName(model.name)} = {
${indent_string_1.default(model.fields
            .filter(f => this.isDefault(f))
            .map(f => `${f.name}: true`)
            .join('\n'), tab)}
}
`;
    }
    isDefault(field) {
        if (field.kind !== 'object') {
            return true;
        }
        const model = this.dmmf.datamodel.models.find(m => field.type === m.name);
        return model.isEmbedded;
    }
}
class Model {
    constructor(model, dmmf) {
        this.model = model;
        this.dmmf = dmmf;
        const outputType = dmmf.outputTypeMap[model.name];
        this.outputType = new OutputType(outputType);
        this.mapping = dmmf.mappings.find(m => m.model === model.name);
    }
    get argsTypes() {
        const { mapping, model } = this;
        const argsTypes = [];
        for (const action in dmmf_types_1.DMMF.ModelAction) {
            const fieldName = mapping[action];
            if (!fieldName) {
                continue;
            }
            const field = this.dmmf.getField(fieldName);
            if (!field) {
                throw new Error(`Oops this must not happen. Could not find field ${fieldName} on either Query or Mutation`);
            }
            if (action === 'updateMany' || action === 'deleteMany') {
                argsTypes.push(new MinimalArgsType(field.args, model, action));
            }
            else {
                argsTypes.push(new ArgsType(field.args, model, action));
            }
        }
        argsTypes.push(new ArgsType([], model));
        return argsTypes;
    }
    toString() {
        const { model, outputType } = this;
        if (!outputType) {
            return '';
        }
        const scalarFields = model.fields.filter(f => f.kind !== 'object');
        return `
/**
 * Model ${model.name}
 */

export type ${model.name} = {
${indent_string_1.default(model.fields
            .filter(f => f.kind !== 'object')
            .map(field => new OutputField(field).toString())
            .join('\n'), tab)}
}

${scalarFields.length > 0
            ? `export type ${utils_1.getScalarsName(model.name)} = ${scalarFields.length > 0
                ? scalarFields.map(f => `'${f.name}'`).join(' | ')
                : ``}
  `
            : ''}

export type ${utils_1.getSelectName(model.name)} = {
${indent_string_1.default(outputType.fields
            .map(f => `${f.name}?: boolean` +
            (f.outputType.kind === 'object'
                ? ` | ${utils_1.getFieldArgName(f, utils_1.Projection.select)}Optional`
                : ''))
            .join('\n'), tab)}
}

export type ${utils_1.getIncludeName(model.name)} = {
${indent_string_1.default(outputType.fields
            .filter(f => f.outputType.kind === 'object')
            .map(f => `${f.name}?: boolean` +
            (f.outputType.kind === 'object'
                ? ` | ${utils_1.getFieldArgName(f, utils_1.Projection.include)}Optional`
                : ''))
            .join('\n'), tab)}
}

${new ModelDefault(model, this.dmmf)}

${new PayloadType(this.outputType, utils_1.Projection.select)}

${new PayloadType(this.outputType, utils_1.Projection.include)}

${new ModelDelegate(this.outputType, this.dmmf)}

// Custom InputTypes
${this.argsTypes.map(String).join('\n')}
`;
    }
}
exports.Model = Model;
class Query {
    constructor(dmmf, operation) {
        this.dmmf = dmmf;
        this.operation = operation;
    }
    toString() {
        const { dmmf, operation } = this;
        const queryName = common_1.capitalize(operation);
        const mappings = dmmf.mappings.map(mapping => ({
            name: mapping.model,
            mapping: Object.entries(mapping).filter(([key]) => utils_1.isQueryAction(key, operation)),
        }));
        const queryType = operation === 'query' ? dmmf.queryType : dmmf.mutationType;
        const outputType = new OutputType(queryType);
        return `\
/**
 * ${queryName}
 */

export type ${queryName}Args = {
${indent_string_1.default(mappings
            .flatMap(({ name, mapping }) => mapping
            .filter(([action, field]) => field)
            .map(([action, field]) => `${field}?: ${utils_1.getModelArgName(name, utils_1.Projection.select, action)}`))
            .join('\n'), tab)}
}

${new QueryPayloadType(outputType)}

${new QueryDelegate(outputType)}
`;
    }
}
exports.Query = Query;
class ModelDelegate {
    constructor(outputType, dmmf) {
        this.outputType = outputType;
        this.dmmf = dmmf;
    }
    toString() {
        const { fields, name } = this.outputType;
        const mapping = this.dmmf.mappings.find(m => m.model === name);
        const actions = Object.entries(mapping).filter(([key, value]) => key !== 'model' && key !== 'plural' && key !== 'aggregate' && value);
        const listConstraint = utils_1.getModelArgName(name, 
        /*projection*/ undefined, dmmf_types_1.DMMF.ModelAction.findMany);
        // TODO: The following code needs to be split up and is a mess
        return `\
export interface ${name}Delegate {
  <T extends ${listConstraint}>(args?: Subset<T, ${utils_1.getModelArgName(name, undefined, dmmf_types_1.DMMF.ModelAction.findMany)}>): ${utils_1.getSelectReturnType({
            name,
            actionName: dmmf_types_1.DMMF.ModelAction.findMany,
            hideCondition: true,
            isField: false,
            renderPromise: true,
            projection: utils_1.Projection.select,
        })}
${indent_string_1.default(actions
            .map(([actionName]) => `${actionName}<T extends ${utils_1.getModelArgName(name, 
        /*projection*/ undefined, actionName)}>(
  args${actionName === dmmf_types_1.DMMF.ModelAction.findMany ? '?' : ''}: Subset<T, ${utils_1.getModelArgName(name, undefined, actionName)}>
): ${utils_1.getSelectReturnType({ name, actionName, projection: utils_1.Projection.select })}`)
            .join('\n'), tab)}
  count(): Promise<number>
}
function ${name}Delegate(dmmf: DMMFClass, fetcher: PhotonFetcher): ${name}Delegate {
  const ${name} = <T extends ${listConstraint}>(args: Subset<T, ${utils_1.getModelArgName(name, undefined, dmmf_types_1.DMMF.ModelAction.findMany)}>) => new ${name}Client<${utils_1.getSelectReturnType({
            name,
            actionName: dmmf_types_1.DMMF.ModelAction.findMany,
            projection: utils_1.Projection.select,
        })}>(dmmf, fetcher, 'query', '${mapping.findMany}', '${mapping.plural}', args, [])
${indent_string_1.default(actions
            .map(([actionName, fieldName]) => actionName === 'deleteMany' || actionName === 'updateMany'
            ? `${name}.${actionName} = (args: ${utils_1.getModelArgName(name, undefined, actionName)}) => new ${name}Client<Promise<BatchPayload>>(${utils_1.renderInitialClientArgs(actionName, fieldName, mapping)})`
            : `${name}.${actionName} = <T extends ${utils_1.getModelArgName(name, 
            /*projection*/ undefined, actionName)}>(args: Subset<T, ${utils_1.getModelArgName(name, utils_1.Projection.select, actionName)}>) => ${actionName !== 'findMany' ? `args.select ? ` : ''}new ${name}Client<${utils_1.getSelectReturnType({
                name,
                actionName,
                hideCondition: false,
                isField: true,
                projection: utils_1.Projection.select,
            })}>(${utils_1.renderInitialClientArgs(actionName, fieldName, mapping)})${actionName !== 'findMany'
                ? ` : new ${name}Client<${(utils_1.getType(name, actionName === 'findMany'),
                    actionName === 'findOne')}>(${utils_1.renderInitialClientArgs(actionName, fieldName, mapping)})`
                : ''}`)
            .join('\n'), tab)}
  ${name}.count = () => new ${name}Client<number>(dmmf, fetcher, 'query', '${mapping.aggregate}', '${mapping.plural}.count', {}, ['count'])
  return ${name} as any // any needed until https://github.com/microsoft/TypeScript/issues/31335 is resolved
}

export class ${name}Client<T> implements Promise<T> {
  private _callsite: any
  private _requestPromise?: Promise<any>
  constructor(
    private readonly _dmmf: DMMFClass,
    private readonly _fetcher: PhotonFetcher,
    private readonly _queryType: 'query' | 'mutation',
    private readonly _rootField: string,
    private readonly _clientMethod: string,
    private readonly _args: any,
    private readonly _path: string[],
    private _isList = false
  ) {
    // @ts-ignore
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
      const error = new Error()
      if (error && error.stack) {
        const stack = error.stack
        this._callsite = stack
      }
    }
  }
  readonly [Symbol.toStringTag]: 'PhotonPromise'

${indent_string_1.default(fields
            .filter(f => f.outputType.kind === 'object')
            .map(f => {
            const fieldTypeName = f.outputType.type.name;
            return `
${f.name}<T extends ${utils_1.getFieldArgName(f)} = {}>(args?: Subset<T, ${utils_1.getFieldArgName(f)}>): ${utils_1.getSelectReturnType({
                name: fieldTypeName,
                actionName: f.outputType.isList
                    ? dmmf_types_1.DMMF.ModelAction.findMany
                    : dmmf_types_1.DMMF.ModelAction.findOne,
                hideCondition: false,
                isField: true,
                renderPromise: true,
                fieldName: f.name,
                projection: utils_1.Projection.select,
            })} {
  const prefix = this._path.includes('select') ? 'select' : this._path.includes('include') ? 'include' : 'select'
  const path = [...this._path, prefix, '${f.name}']
  const newArgs = deepSet(this._args, path, args || true)
  this._isList = ${f.outputType.isList}
  return new ${utils_1.getFieldTypeName(f)}Client<${utils_1.getSelectReturnType({
                name: fieldTypeName,
                actionName: f.outputType.isList
                    ? dmmf_types_1.DMMF.ModelAction.findMany
                    : dmmf_types_1.DMMF.ModelAction.findOne,
                hideCondition: false,
                isField: true,
                renderPromise: true,
                projection: utils_1.Projection.select,
            })}>(this._dmmf, this._fetcher, this._queryType, this._rootField, this._clientMethod, newArgs, path, this._isList) as any
}`;
        })
            .join('\n'), 2)}

  private get _document() {
    const { _rootField: rootField } = this
    const document = makeDocument({
      dmmf: this._dmmf,
      rootField,
      rootTypeName: this._queryType,
      select: this._args
    })
    try {
      document.validate(this._args, false, this._clientMethod)
    } catch (e) {
      const x: any = e
      if (x.render) {
        if (this._callsite) {
          e.message = x.render(this._callsite)
        }
      }
      throw e
    }
    return transformDocument(document)
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    if (!this._requestPromise){
      this._requestPromise = this._fetcher.request<T>(this._document, this._path, this._rootField, '${name}', this._isList, this._callsite)
    }
    return this._requestPromise!.then(onfulfilled, onrejected)
  }

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null,
  ): Promise<T | TResult> {
    if (!this._requestPromise) {
      this._requestPromise = this._fetcher.request<T>(this._document, this._path, this._rootField, '${name}', this._isList, this._callsite)
    }
    return this._requestPromise!.catch(onrejected)
  }

  /**
   * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
   * resolved value cannot be modified from the callback.
   * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
   * @returns A Promise for the completion of the callback.
   */
  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    if (!this._requestPromise) {
      this._requestPromise = this._fetcher.request<T>(this._document, this._path, this._rootField, '${name}', this._isList, this._callsite)
    }
    return this._requestPromise!.finally(onfinally)
  }
}
    `;
    }
}
exports.ModelDelegate = ModelDelegate;
class QueryDelegate {
    constructor(outputType) {
        this.outputType = outputType;
    }
    toString() {
        const name = this.outputType.name;
        return `\
interface ${name}Delegate {
  <T extends ${name}Args>(args: Subset<T,${name}Args>): Promise<${utils_1.getPayloadName(name, utils_1.Projection.select)}<T>>
}
function ${name}Delegate(dmmf: DMMFClass, fetcher: PhotonFetcher): ${name}Delegate {
  const ${name} = <T extends ${name}Args>(args: ${name}Args) => new ${name}Client<T>(dmmf, fetcher, args, [])
  return ${name}
}

class ${name}Client<T extends ${name}Args, U = ${utils_1.getPayloadName(name, utils_1.Projection.select)}<T>> implements Promise<U> {
  constructor(private readonly dmmf: DMMFClass, private readonly fetcher: PhotonFetcher, private readonly args: ${name}Args, private readonly path: []) {}

  readonly [Symbol.toStringTag]: 'Promise'

  protected get document() {
    const rootField = Object.keys(this.args)[0]
    const document = makeDocument({
      dmmf: this.dmmf,
      rootField,
      rootTypeName: 'query',
      // @ts-ignore
      select: this.args[rootField]
    })
    // @ts-ignore
    document.validate(this.args[rootField], true)
    return document
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = U, TResult2 = never>(
    onfulfilled?: ((value: U) => TResult1 | Promise<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.fetcher.request<U>(this.document, this.path, undefined, '${name}').then(onfulfilled, onrejected)
  }

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null,
  ): Promise<U | TResult> {
    return this.fetcher.request<U>(this.document, this.path, undefined, '${name}').catch(onrejected)
  }
}
    `;
    }
}
exports.QueryDelegate = QueryDelegate;
class InputField {
    constructor(field, prefixFilter = false) {
        this.field = field;
        this.prefixFilter = prefixFilter;
    }
    toString() {
        const { field } = this;
        let fieldType;
        if (Array.isArray(field.inputType)) {
            fieldType = field.inputType
                .flatMap(t => typeof t.type === 'string'
                ? common_1.GraphQLScalarToJSTypeTable[t.type] || t.type
                : this.prefixFilter
                    ? `Base${t.type.name}`
                    : t.type.name)
                .join(' | ');
        }
        const fieldInputType = field.inputType[0];
        const optionalStr = fieldInputType.isRequired ? '' : '?';
        if (fieldInputType.isList) {
            fieldType = `Enumerable<${fieldType}>`;
        }
        const nullableStr = !fieldInputType.isRequired ? ' | null' : '';
        return `${field.name}${optionalStr}: ${fieldType}${nullableStr}`;
    }
}
exports.InputField = InputField;
class OutputField {
    constructor(field) {
        this.field = field;
    }
    toString() {
        const { field } = this;
        // ENUMTODO
        let fieldType = typeof field.type === 'string'
            ? common_1.GraphQLScalarToJSTypeTable[field.type] || field.type
            : field.type[0].name;
        if (Array.isArray(fieldType)) {
            fieldType = fieldType[0];
        }
        const arrayStr = field.isList ? `[]` : '';
        const nullableStr = !field.isRequired && !field.isList ? ' | null' : '';
        return `${field.name}: ${fieldType}${arrayStr}${nullableStr}`;
    }
}
exports.OutputField = OutputField;
class OutputType {
    constructor(type) {
        this.type = type;
        this.name = type.name;
        this.fields = type.fields;
    }
    toString() {
        const { type } = this;
        return `
export type ${type.name} = {
${indent_string_1.default(type.fields
            .map(field => new OutputField(Object.assign(Object.assign({}, field), field.outputType)).toString())
            .join('\n'), tab)}
}`;
    }
}
exports.OutputType = OutputType;
class MinimalArgsType {
    constructor(args, model, action) {
        this.args = args;
        this.model = model;
        this.action = action;
    }
    toString() {
        const { action, args } = this;
        const { name } = this.model;
        return `
/**
 * ${name} ${action ? action : 'without action'}
 */
export type ${utils_1.getModelArgName(name, undefined, action)} = {
${indent_string_1.default(args.map(arg => new InputField(arg).toString()).join('\n'), tab)}
}
`;
    }
}
exports.MinimalArgsType = MinimalArgsType;
class ArgsType {
    constructor(args, model, action) {
        this.args = args;
        this.model = model;
        this.action = action;
    }
    toString() {
        const { action, args } = this;
        const { name } = this.model;
        const bothArgsOptional = [
            {
                name: 'select',
                inputType: [
                    {
                        type: utils_1.getSelectName(name),
                        kind: 'object',
                        isList: false,
                        isRequired: false,
                    },
                ],
            },
            {
                name: 'include',
                inputType: [
                    {
                        type: utils_1.getIncludeName(name),
                        kind: 'object',
                        isList: false,
                        isRequired: false,
                    },
                ],
            },
            ...args,
        ];
        const bothArgsRequired = [
            {
                name: 'select',
                inputType: [
                    {
                        type: utils_1.getSelectName(name),
                        kind: 'object',
                        isList: false,
                        isRequired: true,
                    },
                ],
            },
            {
                name: 'include',
                inputType: [
                    {
                        type: utils_1.getIncludeName(name),
                        kind: 'object',
                        isList: false,
                        isRequired: true,
                    },
                ],
            },
            ...args,
        ];
        const selectArgsRequired = [
            {
                name: 'select',
                inputType: [
                    {
                        type: utils_1.getSelectName(name),
                        kind: 'object',
                        isList: false,
                        isRequired: true,
                    },
                ],
            },
            ...args,
        ];
        const selectArgsOptional = [
            {
                name: 'select',
                inputType: [
                    {
                        type: utils_1.getSelectName(name),
                        kind: 'object',
                        isList: false,
                        isRequired: false,
                    },
                ],
            },
            ...args,
        ];
        const includeArgsRequired = [
            {
                name: 'include',
                inputType: [
                    {
                        type: utils_1.getIncludeName(name),
                        kind: 'object',
                        isList: false,
                        isRequired: true,
                    },
                ],
            },
            ...args,
        ];
        const includeArgsOptional = [
            {
                name: 'include',
                inputType: [
                    {
                        type: utils_1.getIncludeName(name),
                        kind: 'object',
                        isList: false,
                        isRequired: false,
                    },
                ],
            },
            ...args,
        ];
        return `
/**
 * ${name} ${action ? action : 'without action'}
 */
export type ${utils_1.getModelArgName(name, undefined, action)} = {
${indent_string_1.default(bothArgsOptional.map(arg => new InputField(arg).toString()).join('\n'), tab)}
}

export type ${utils_1.getModelArgName(name, undefined, action)}Required = {
${indent_string_1.default(bothArgsRequired.map(arg => new InputField(arg).toString()).join('\n'), tab)}
}

export type ${utils_1.getModelArgName(name, utils_1.Projection.select, action)} = {
${indent_string_1.default(selectArgsRequired.map(arg => new InputField(arg).toString()).join('\n'), tab)}
}

export type ${utils_1.getModelArgName(name, utils_1.Projection.select, action)}Optional = {
${indent_string_1.default(selectArgsOptional.map(arg => new InputField(arg).toString()).join('\n'), tab)}
}

export type ${utils_1.getModelArgName(name, utils_1.Projection.include, action)} = {
${indent_string_1.default(includeArgsRequired.map(arg => new InputField(arg).toString()).join('\n'), tab)}
}

export type ${utils_1.getModelArgName(name, utils_1.Projection.include, action)}Optional = {
${indent_string_1.default(includeArgsOptional.map(arg => new InputField(arg).toString()).join('\n'), tab)}
}

export type Extract${utils_1.getModelArgName(name, utils_1.Projection.select, action)}<S extends undefined | boolean | ${utils_1.getModelArgName(name, utils_1.Projection.select, action)}Optional> = S extends undefined
  ? false
  : S extends boolean
  ? S
  : S extends ${utils_1.getModelArgName(name, utils_1.Projection.select, action)}
  ? S['select']
  : true

export type Extract${utils_1.getModelArgName(name, utils_1.Projection.include, action)}<S extends undefined | boolean | ${utils_1.getModelArgName(name, utils_1.Projection.include, action)}Optional> = S extends undefined
  ? false
  : S extends boolean
  ? S
  : S extends ${utils_1.getModelArgName(name, utils_1.Projection.include, action)}
  ? S['include']
  : true

`;
    }
}
exports.ArgsType = ArgsType;
class InputType {
    constructor(type) {
        this.type = type;
    }
    toString() {
        const { type } = this;
        // TO DISCUSS: Should we rely on TypeScript's error messages?
        const body = `{
${indent_string_1.default(type.fields
            .map(arg => new InputField(arg /*, type.atLeastOne && !type.atMostOne*/))
            .join('\n'), tab)}
}`;
        //     if (type.atLeastOne && !type.atMostOne) {
        //       return `export type Base${type.name} = ${body}
        // export type ${type.name} = AtLeastOne<Base${type.name}>
        //       `
        //     } else if (type.atLeastOne && type.atMostOne) {
        //       return `export type Base${type.name} = ${body}
        // export type ${type.name} = OnlyOne<Base${type.name}>
        //       `
        //     }
        return `
export type ${type.name} = ${body}`;
    }
}
exports.InputType = InputType;
class Enum {
    constructor(type) {
        this.type = type;
    }
    toString() {
        const { type } = this;
        return `export const ${type.name} = makeEnum({
${indent_string_1.default(type.values.map(v => `${v}: '${v}'`).join(',\n'), tab)}
})

export type ${type.name} = (typeof ${type.name})[keyof typeof ${type.name}]\n`;
    }
}
exports.Enum = Enum;
//# sourceMappingURL=TSClient.js.map