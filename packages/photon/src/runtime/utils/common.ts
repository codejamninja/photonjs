import chalk from 'chalk'
import indent from 'indent-string'
import leven from 'js-levenshtein'
import { DMMF } from '../dmmf-types'

export interface Dictionary<T> {
  [key: string]: T
}

export const keyBy: <T>(collection: T[], iteratee: (value: T) => string) => Dictionary<T> = (collection, iteratee) => {
  return collection.reduce<any>((acc, curr) => {
    acc[iteratee(curr)] = curr
    return acc
  }, {})
}

export const ScalarTypeTable = {
  String: true,
  Int: true,
  Float: true,
  Boolean: true,
  Long: true,
  DateTime: true,
  ID: true,
  UUID: true,
  Json: true,
}

export function isScalar(str: string): boolean {
  if (typeof str !== 'string') {
    return false
  }
  return ScalarTypeTable[str] || false
}

export const GraphQLScalarToJSTypeTable = {
  String: 'string',
  Int: 'number',
  Float: 'number',
  Boolean: 'boolean',
  Long: 'number',
  DateTime: ['Date', 'string'],
  ID: 'string',
  UUID: 'string',
  Json: 'object',
}

export const JSTypeToGraphQLType = {
  string: 'String',
  boolean: 'Boolean',
  object: 'Json',
}

export function stringifyGraphQLType(type: string | DMMF.InputType | DMMF.Enum) {
  if (typeof type === 'string') {
    return type
  }
  return type.name
}

export function wrapWithList(str: string, isList: boolean) {
  if (isList) {
    return `List<${str}>`
  }

  return str
}

export function getGraphQLType(value: any, potentialType?: string | DMMF.Enum | DMMF.InputType): string {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    const scalarTypes = value.reduce((acc, val) => {
      const type = getGraphQLType(val, potentialType)
      if (!acc.includes(type)) {
        acc.push(type)
      }
      return acc
    }, [])
    return `List<${scalarTypes.join(' | ')}>`
  }
  const jsType = typeof value
  if (jsType === 'number') {
    if (Math.trunc(value) === value) {
      return 'Int'
    } else {
      return 'Float'
    }
  }
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return 'DateTime'
  }
  if (jsType === 'string') {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      return 'UUID'
    }
    const date = new Date(value)
    if (
      potentialType &&
      typeof potentialType === 'object' &&
      (potentialType as DMMF.Enum).values &&
      (potentialType as DMMF.Enum).values.includes(value)
    ) {
      return potentialType.name
    }
    if (date.toString() === 'Invalid Date') {
      return 'String'
    }
    if (date.toISOString() === value) {
      return 'DateTime'
    }
  }
  return JSTypeToGraphQLType[jsType]
}

export function graphQLToJSType(gql: string) {
  return GraphQLScalarToJSTypeTable[gql]
}

export function getSuggestion(str: string, possibilities: string[]): string | null {
  const bestMatch = possibilities.reduce<{ distance: number; str: string | null }>(
    (acc, curr) => {
      const distance = leven(str, curr)
      if (distance < acc.distance) {
        return {
          distance,
          str: curr,
        }
      }

      return acc
    },
    {
      // heuristic to be not too strict, but allow some big mistakes (<= ~ 5)
      distance: Math.min(Math.floor(str.length) * 1.1, ...possibilities.map(p => p.length * 3)),
      str: null,
    },
  )

  return bestMatch.str
}

export function stringifyInputType(input: string | DMMF.InputType | DMMF.Enum, greenKeys: boolean = false): string {
  if (typeof input === 'string') {
    return input
  }
  if ((input as DMMF.Enum).values) {
    return `enum ${input.name} {\n${indent((input as DMMF.Enum).values.join(', '), 2)}\n}`
  } else {
    const body = indent(
      (input as DMMF.InputType).fields // TS doesn't discriminate based on existence of fields properly
        .map(arg => {
          const argInputType = arg.inputType[0]
          const key = `${arg.name}`
          const str = `${greenKeys ? chalk.green(key) : key}${argInputType.isRequired ? '' : '?'}: ${chalk.white(
            arg.inputType
              .map(argType =>
                argIsInputType(argType.type)
                  ? argType.type.name
                  : wrapWithList(stringifyGraphQLType(argType.type), argType.isList),
              )
              .join(' | '),
          )}`
          if (!argInputType.isRequired) {
            return chalk.dim(str)
          }

          return str
        })
        .join('\n'),
      2,
    )
    return `${chalk.dim('type')} ${chalk.bold.dim(input.name)} ${chalk.dim('{')}\n${body}\n${chalk.dim('}')}`
  }
}

function argIsInputType(arg: DMMF.ArgType): arg is DMMF.InputType {
  if (typeof arg === 'string') {
    return false
  }

  return true
}

export function getInputTypeName(input: string | DMMF.InputType | DMMF.SchemaField | DMMF.Enum) {
  if (typeof input === 'string') {
    return input
  }

  return input.name
}

export function getOutputTypeName(input: string | DMMF.OutputType | DMMF.SchemaField | DMMF.Enum) {
  if (typeof input === 'string') {
    return input
  }

  return input.name
}

export function inputTypeToJson(
  input: string | DMMF.InputType | DMMF.Enum,
  isRequired: boolean,
  nameOnly: boolean = false,
): string | object {
  if (typeof input === 'string') {
    return input
  }

  if ((input as DMMF.Enum).values) {
    return (input as DMMF.Enum).values.join(' | ')
  }

  // TS "Trick" :/
  const inputType: DMMF.InputType = input as DMMF.InputType
  // If the parent type is required and all fields are non-scalars,
  // it's very useful to show to the user, which options they actually have
  const showDeepType =
    isRequired &&
    inputType.fields.every(arg => arg.inputType[0].kind === 'object') &&
    !inputType.isWhereType &&
    !inputType.atLeastOne
  if (nameOnly) {
    return getInputTypeName(input)
  }

  return inputType.fields.reduce((acc, curr) => {
    const argInputType = curr.inputType[0]
    acc[curr.name + (argInputType.isRequired ? '' : '?')] =
      curr.isRelationFilter && !showDeepType && !argInputType.isRequired
        ? getInputTypeName(argInputType.type)
        : inputTypeToJson(argInputType.type, argInputType.isRequired, true)
    return acc
  }, {})
}

export function destroyCircular(from, seen: any[] = []) {
  const to: any = Array.isArray(from) ? [] : {}

  seen.push(from)

  for (const key of Object.keys(from)) {
    const value = from[key]

    if (typeof value === 'function') {
      continue
    }

    if (!value || typeof value !== 'object') {
      to[key] = value
      continue
    }

    if (seen.indexOf(from[key]) === -1) {
      to[key] = destroyCircular(from[key], seen.slice(0))
      continue
    }

    to[key] = '[Circular]'
  }

  if (typeof from.name === 'string') {
    to.name = from.name
  }

  if (typeof from.message === 'string') {
    to.message = from.message
  }

  if (typeof from.stack === 'string') {
    to.stack = from.stack
  }

  return to
}

export function unionBy<T>(arr1: T[], arr2: T[], iteratee: (element: T) => string | number): T[] {
  const map = {}

  for (const element of arr1) {
    map[iteratee(element)] = element
  }

  for (const element of arr2) {
    const key = iteratee(element)
    if (!map[key]) {
      map[key] = element
    }
  }

  return Object.values(map)
}

export function uniqBy<T>(arr: T[], iteratee: (element: T) => string | number): T[] {
  const map = {}

  for (const element of arr) {
    map[iteratee(element)] = element
  }

  return Object.values(map)
}

export function capitalize(str: string): string {
  return str[0].toUpperCase() + str.slice(1)
}

/**
 * Converts the first character of a word to lower case
 * @param name
 */
export function lowerCase(name: string): string {
  return name.substring(0, 1).toLowerCase() + name.substring(1)
}
