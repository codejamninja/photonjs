"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const indent_string_1 = __importDefault(require("indent-string"));
const js_levenshtein_1 = __importDefault(require("js-levenshtein"));
exports.keyBy = (collection, iteratee) => {
    return collection.reduce((acc, curr) => {
        acc[iteratee(curr)] = curr;
        return acc;
    }, {});
};
exports.ScalarTypeTable = {
    String: true,
    Int: true,
    Float: true,
    Boolean: true,
    Long: true,
    DateTime: true,
    ID: true,
    UUID: true,
    Json: true,
};
function isScalar(str) {
    if (typeof str !== 'string') {
        return false;
    }
    return exports.ScalarTypeTable[str] || false;
}
exports.isScalar = isScalar;
exports.GraphQLScalarToJSTypeTable = {
    String: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    Long: 'number',
    DateTime: ['Date', 'string'],
    ID: 'string',
    UUID: 'string',
    Json: 'object',
};
exports.JSTypeToGraphQLType = {
    string: 'String',
    boolean: 'Boolean',
    object: 'Json',
};
function stringifyGraphQLType(type) {
    if (typeof type === 'string') {
        return type;
    }
    return type.name;
}
exports.stringifyGraphQLType = stringifyGraphQLType;
function wrapWithList(str, isList) {
    if (isList) {
        return `List<${str}>`;
    }
    return str;
}
exports.wrapWithList = wrapWithList;
function getGraphQLType(value, potentialType) {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        const scalarTypes = value.reduce((acc, val) => {
            const type = getGraphQLType(val, potentialType);
            if (!acc.includes(type)) {
                acc.push(type);
            }
            return acc;
        }, []);
        return `List<${scalarTypes.join(' | ')}>`;
    }
    const jsType = typeof value;
    if (jsType === 'number') {
        if (Math.trunc(value) === value) {
            return 'Int';
        }
        else {
            return 'Float';
        }
    }
    if (Object.prototype.toString.call(value) === '[object Date]') {
        return 'DateTime';
    }
    if (jsType === 'string') {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
            return 'UUID';
        }
        const date = new Date(value);
        if (potentialType &&
            typeof potentialType === 'object' &&
            potentialType.values &&
            potentialType.values.includes(value)) {
            return potentialType.name;
        }
        if (date.toString() === 'Invalid Date') {
            return 'String';
        }
        if (date.toISOString() === value) {
            return 'DateTime';
        }
    }
    return exports.JSTypeToGraphQLType[jsType];
}
exports.getGraphQLType = getGraphQLType;
function graphQLToJSType(gql) {
    return exports.GraphQLScalarToJSTypeTable[gql];
}
exports.graphQLToJSType = graphQLToJSType;
function getSuggestion(str, possibilities) {
    const bestMatch = possibilities.reduce((acc, curr) => {
        const distance = js_levenshtein_1.default(str, curr);
        if (distance < acc.distance) {
            return {
                distance,
                str: curr,
            };
        }
        return acc;
    }, {
        // heuristic to be not too strict, but allow some big mistakes (<= ~ 5)
        distance: Math.min(Math.floor(str.length) * 1.1, ...possibilities.map(p => p.length * 3)),
        str: null,
    });
    return bestMatch.str;
}
exports.getSuggestion = getSuggestion;
function stringifyInputType(input, greenKeys = false) {
    if (typeof input === 'string') {
        return input;
    }
    if (input.values) {
        return `enum ${input.name} {\n${indent_string_1.default(input.values.join(', '), 2)}\n}`;
    }
    else {
        const body = indent_string_1.default(input.fields // TS doesn't discriminate based on existence of fields properly
            .map(arg => {
            const argInputType = arg.inputType[0];
            const key = `${arg.name}`;
            const str = `${greenKeys ? chalk_1.default.green(key) : key}${argInputType.isRequired ? '' : '?'}: ${chalk_1.default.white(arg.inputType
                .map(argType => argIsInputType(argType.type)
                ? argType.type.name
                : wrapWithList(stringifyGraphQLType(argType.type), argType.isList))
                .join(' | '))}`;
            if (!argInputType.isRequired) {
                return chalk_1.default.dim(str);
            }
            return str;
        })
            .join('\n'), 2);
        return `${chalk_1.default.dim('type')} ${chalk_1.default.bold.dim(input.name)} ${chalk_1.default.dim('{')}\n${body}\n${chalk_1.default.dim('}')}`;
    }
}
exports.stringifyInputType = stringifyInputType;
function argIsInputType(arg) {
    if (typeof arg === 'string') {
        return false;
    }
    return true;
}
function getInputTypeName(input) {
    if (typeof input === 'string') {
        return input;
    }
    return input.name;
}
exports.getInputTypeName = getInputTypeName;
function getOutputTypeName(input) {
    if (typeof input === 'string') {
        return input;
    }
    return input.name;
}
exports.getOutputTypeName = getOutputTypeName;
function inputTypeToJson(input, isRequired, nameOnly = false) {
    if (typeof input === 'string') {
        return input;
    }
    if (input.values) {
        return input.values.join(' | ');
    }
    // TS "Trick" :/
    const inputType = input;
    // If the parent type is required and all fields are non-scalars,
    // it's very useful to show to the user, which options they actually have
    const showDeepType = isRequired &&
        inputType.fields.every(arg => arg.inputType[0].kind === 'object') &&
        !inputType.isWhereType &&
        !inputType.atLeastOne;
    if (nameOnly) {
        return getInputTypeName(input);
    }
    return inputType.fields.reduce((acc, curr) => {
        const argInputType = curr.inputType[0];
        acc[curr.name + (argInputType.isRequired ? '' : '?')] =
            curr.isRelationFilter && !showDeepType && !argInputType.isRequired
                ? getInputTypeName(argInputType.type)
                : inputTypeToJson(argInputType.type, argInputType.isRequired, true);
        return acc;
    }, {});
}
exports.inputTypeToJson = inputTypeToJson;
function destroyCircular(from, seen = []) {
    const to = Array.isArray(from) ? [] : {};
    seen.push(from);
    for (const key of Object.keys(from)) {
        const value = from[key];
        if (typeof value === 'function') {
            continue;
        }
        if (!value || typeof value !== 'object') {
            to[key] = value;
            continue;
        }
        if (seen.indexOf(from[key]) === -1) {
            to[key] = destroyCircular(from[key], seen.slice(0));
            continue;
        }
        to[key] = '[Circular]';
    }
    if (typeof from.name === 'string') {
        to.name = from.name;
    }
    if (typeof from.message === 'string') {
        to.message = from.message;
    }
    if (typeof from.stack === 'string') {
        to.stack = from.stack;
    }
    return to;
}
exports.destroyCircular = destroyCircular;
function unionBy(arr1, arr2, iteratee) {
    const map = {};
    for (const element of arr1) {
        map[iteratee(element)] = element;
    }
    for (const element of arr2) {
        const key = iteratee(element);
        if (!map[key]) {
            map[key] = element;
        }
    }
    return Object.values(map);
}
exports.unionBy = unionBy;
function uniqBy(arr, iteratee) {
    const map = {};
    for (const element of arr) {
        map[iteratee(element)] = element;
    }
    return Object.values(map);
}
exports.uniqBy = uniqBy;
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}
exports.capitalize = capitalize;
/**
 * Converts the first character of a word to lower case
 * @param name
 */
function lowerCase(name) {
    return name.substring(0, 1).toLowerCase() + name.substring(1);
}
exports.lowerCase = lowerCase;
//# sourceMappingURL=common.js.map