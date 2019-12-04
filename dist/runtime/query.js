"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
require("flat-map-polyfill");
const indent_string_1 = __importDefault(require("indent-string"));
const common_1 = require("./utils/common");
const deep_extend_1 = require("./utils/deep-extend");
const deep_set_1 = require("./utils/deep-set");
const filterObject_1 = require("./utils/filterObject");
const omit_1 = require("./utils/omit");
const printJsonErrors_1 = require("./utils/printJsonErrors");
const printStack_1 = require("./utils/printStack");
const stringifyObject_1 = __importDefault(require("./utils/stringifyObject"));
const visit_1 = require("./visit");
const tab = 2;
class Document {
    constructor(type, children) {
        this.type = type;
        this.children = children;
        this.printFieldError = ({ error, path }) => {
            if (error.type === 'emptySelect') {
                return `The ${chalk_1.default.redBright('`select`')} statement for type ${chalk_1.default.bold(common_1.getOutputTypeName(error.field.outputType.type))} must not be empty. Available options are listed in ${chalk_1.default.greenBright.dim('green')}.`;
            }
            if (error.type === 'emptyInclude') {
                return `The ${chalk_1.default.redBright('`include`')} statement for type ${chalk_1.default.bold(common_1.getOutputTypeName(error.field.outputType.type))} must not be empty. Available options are listed in ${chalk_1.default.greenBright.dim('green')}.`;
            }
            if (error.type === 'noTrueSelect') {
                return `The ${chalk_1.default.redBright('`select`')} statement for type ${chalk_1.default.bold(common_1.getOutputTypeName(error.field.outputType.type))} needs ${chalk_1.default.bold('at least one truthy value')}. Available options are listed in ${chalk_1.default.greenBright.dim('green')}.`;
            }
            if (error.type === 'includeAndSelect') {
                // return `The ${chalk.redBright('`select`')} statement for type ${chalk.bold(
                //   getOutputTypeName(error.field.outputType.type),
                // )} needs ${chalk.bold('at least one truthy value')}. Available options are listed in ${chalk.greenBright.dim(
                //   'green',
                // )}.`
                return `Please ${chalk_1.default.bold('either')} use ${chalk_1.default.greenBright('`include`')} or ${chalk_1.default.greenBright('`select`')}, but ${chalk_1.default.redBright('not both')} at the same time.`;
            }
            if (error.type === 'invalidFieldName') {
                const statement = error.isInclude ? 'include' : 'select';
                const wording = error.isIncludeScalar ? 'Invalid scalar' : 'Unknown';
                let str = `${wording} field ${chalk_1.default.redBright(`\`${error.providedName}\``)} for ${chalk_1.default.bold(statement)} statement on model ${chalk_1.default.bold.white(error.modelName)}. Available options are listed in ${chalk_1.default.greenBright.dim('green')}.`;
                if (error.didYouMean) {
                    str += ` Did you mean ${chalk_1.default.greenBright(`\`${error.didYouMean}\``)}?`;
                }
                if (error.isIncludeScalar) {
                    str += `\nNote, that ${chalk_1.default.bold('include')} statements only accept relation fields.`;
                }
                return str;
            }
            if (error.type === 'invalidFieldType') {
                const str = `Invalid value ${chalk_1.default.redBright(`${stringifyObject_1.default(error.providedValue)}`)} of type ${chalk_1.default.redBright(common_1.getGraphQLType(error.providedValue, undefined))} for field ${chalk_1.default.bold(`${error.fieldName}`)} on model ${chalk_1.default.bold.white(error.modelName)}. Expected either ${chalk_1.default.greenBright('true')} or ${chalk_1.default.greenBright('false')}.`;
                return str;
            }
        };
        this.printArgError = ({ error, path }, hasMissingItems) => {
            if (error.type === 'invalidName') {
                let str = `Unknown arg ${chalk_1.default.redBright(`\`${error.providedName}\``)} in ${chalk_1.default.bold(path.join('.'))} for type ${chalk_1.default.bold(error.outputType ? error.outputType.name : common_1.getInputTypeName(error.originalType))}.`;
                if (error.didYouMeanField) {
                    str += `\n→ Did you forget to wrap it with \`${chalk_1.default.greenBright('select')}\`? ${chalk_1.default.dim('e.g. ' + chalk_1.default.greenBright(`{ select: { ${error.providedName}: ${error.providedValue} } }`))}`;
                }
                else if (error.didYouMeanArg) {
                    str += ` Did you mean \`${chalk_1.default.greenBright(error.didYouMeanArg)}\`?`;
                    if (!hasMissingItems) {
                        str += ` ${chalk_1.default.dim('Available args:')}\n` + common_1.stringifyInputType(error.originalType, true);
                    }
                }
                else {
                    if (error.originalType.fields.length === 0) {
                        str += ` The field ${chalk_1.default.bold(error.originalType.name)} has no arguments.`;
                    }
                    else if (!hasMissingItems) {
                        str += ` Available args:\n\n` + common_1.stringifyInputType(error.originalType, true);
                    }
                }
                return str;
            }
            if (error.type === 'invalidType') {
                let valueStr = stringifyObject_1.default(error.providedValue, { indent: '  ' });
                const multilineValue = valueStr.split('\n').length > 1;
                if (multilineValue) {
                    valueStr = `\n${valueStr}\n`;
                }
                // TODO: we don't yet support enums in a union with a non enum. This is mostly due to not implemented error handling
                // at this code part.
                if (error.requiredType.bestFittingType.kind === 'enum') {
                    return `Argument ${chalk_1.default.bold(error.argName)}: Provided value ${chalk_1.default.redBright(valueStr)}${multilineValue ? '' : ' '}of type ${chalk_1.default.redBright(common_1.getGraphQLType(error.providedValue))} on ${chalk_1.default.bold(`photon.${this.children[0].name}`)} is not a ${chalk_1.default.greenBright(common_1.wrapWithList(common_1.stringifyGraphQLType(error.requiredType.bestFittingType.kind), error.requiredType.bestFittingType.isList))}.
→ Possible values: ${error.requiredType.bestFittingType.type.values
                        .map(v => chalk_1.default.greenBright(`${common_1.stringifyGraphQLType(error.requiredType.bestFittingType.type)}.${v}`))
                        .join(', ')}`;
                }
                let typeStr = '.';
                if (isInputArgType(error.requiredType.bestFittingType.type)) {
                    typeStr = ':\n' + common_1.stringifyInputType(error.requiredType.bestFittingType.type);
                }
                let expected = `${error.requiredType.inputType
                    .map(t => chalk_1.default.greenBright(common_1.wrapWithList(common_1.stringifyGraphQLType(t.type), error.requiredType.bestFittingType.isList)))
                    .join(' or ')}${typeStr}`;
                const inputType = (error.requiredType.inputType.length === 2 && error.requiredType.inputType.find(t => isInputArgType(t.type))) ||
                    null;
                if (inputType) {
                    expected += `\n` + common_1.stringifyInputType(inputType.type, true);
                }
                return `Argument ${chalk_1.default.bold(error.argName)}: Got invalid value ${chalk_1.default.redBright(valueStr)}${multilineValue ? '' : ' '}on ${chalk_1.default.bold(`photon.${this.children[0].name}`)}. Provided ${chalk_1.default.redBright(common_1.getGraphQLType(error.providedValue))}, expected ${expected}`;
            }
            if (error.type === 'missingArg') {
                return `Argument ${chalk_1.default.greenBright(error.missingName)} for ${chalk_1.default.bold(`${path.join('.')}`)} is missing.`;
            }
            if (error.type === 'atLeastOne') {
                return `Argument ${chalk_1.default.bold(path.join('.'))} of type ${chalk_1.default.bold(error.inputType.name)} needs ${chalk_1.default.greenBright('at least one')} argument. Available args are listed in ${chalk_1.default.dim.green('green')}.`;
            }
            if (error.type === 'atMostOne') {
                return `Argument ${chalk_1.default.bold(path.join('.'))} of type ${chalk_1.default.bold(error.inputType.name)} needs ${chalk_1.default.greenBright('exactly one')} argument, but you provided ${error.providedKeys
                    .map(key => chalk_1.default.redBright(key))
                    .join(' and ')}. Please choose one. ${chalk_1.default.dim('Available args:')} \n${common_1.stringifyInputType(error.inputType, true)}`;
            }
        };
        this.type = type;
        this.children = children;
    }
    toString() {
        return `${this.type} {
${indent_string_1.default(this.children.map(String).join('\n'), tab)}
}`;
    }
    validate(select, isTopLevelQuery = false, originalMethod) {
        const invalidChildren = this.children.filter(child => child.hasInvalidChild || child.hasInvalidArg);
        if (invalidChildren.length === 0) {
            return;
        }
        const fieldErrors = [];
        const argErrors = [];
        const prefix = select && select.select ? 'select' : select.include ? 'include' : undefined;
        for (const child of invalidChildren) {
            const errors = child.collectErrors(prefix);
            fieldErrors.push(...errors.fieldErrors.map(e => (Object.assign(Object.assign({}, e), { path: isTopLevelQuery ? e.path : e.path.slice(1) }))));
            argErrors.push(...errors.argErrors.map(e => (Object.assign(Object.assign({}, e), { path: isTopLevelQuery ? e.path : e.path.slice(1) }))));
        }
        const topLevelQueryName = this.children[0].name;
        const queryName = isTopLevelQuery ? this.type : topLevelQueryName;
        const keyPaths = [];
        const valuePaths = [];
        const missingItems = [];
        for (const fieldError of fieldErrors) {
            const path = this.normalizePath(fieldError.path, select).join('.');
            if (fieldError.error.type === 'invalidFieldName') {
                keyPaths.push(path);
                const fieldType = fieldError.error.outputType;
                const { isInclude } = fieldError.error;
                fieldType.fields
                    .filter(field => (isInclude ? field.outputType.kind === 'object' : true))
                    .forEach(field => {
                    const splittedPath = path.split('.');
                    missingItems.push({
                        path: `${splittedPath.slice(0, splittedPath.length - 1).join('.')}.${field.name}`,
                        type: 'true',
                        isRequired: false,
                    });
                });
            }
            else if (fieldError.error.type === 'includeAndSelect') {
                keyPaths.push('select');
                keyPaths.push('include');
            }
            else {
                valuePaths.push(path);
            }
            if (fieldError.error.type === 'emptySelect' ||
                fieldError.error.type === 'noTrueSelect' ||
                fieldError.error.type === 'emptyInclude') {
                const selectPathArray = this.normalizePath(fieldError.path, select);
                const selectPath = selectPathArray.slice(0, selectPathArray.length - 1).join('.');
                const fieldType = fieldError.error.field.outputType.type;
                fieldType.fields
                    .filter(field => (fieldError.error.type === 'emptyInclude' ? field.outputType.kind === 'object' : true))
                    .forEach(field => {
                    missingItems.push({
                        path: `${selectPath}.${field.name}`,
                        type: 'true',
                        isRequired: false,
                    });
                });
            }
        }
        // an arg error can either be an invalid key or invalid value
        for (const argError of argErrors) {
            const path = this.normalizePath(argError.path, select).join('.');
            if (argError.error.type === 'invalidName') {
                keyPaths.push(path);
            }
            else if (argError.error.type !== 'missingArg' && argError.error.type !== 'atLeastOne') {
                valuePaths.push(path);
            }
            else if (argError.error.type === 'missingArg') {
                const type = argError.error.missingType.length === 1
                    ? argError.error.missingType[0].type
                    : argError.error.missingType.map(t => common_1.getInputTypeName(t.type)).join(' | ');
                missingItems.push({
                    path,
                    type: common_1.inputTypeToJson(type, true, path.split('where.').length === 2),
                    isRequired: argError.error.missingType[0].isRequired,
                });
            }
        }
        const renderErrorStr = (callsite) => {
            const { stack, indent: indentValue, afterLines } = printStack_1.printStack({
                callsite,
                originalMethod: originalMethod || queryName,
            });
            const hasRequiredMissingArgsErrors = argErrors.some(e => e.error.type === 'missingArg' && e.error.missingType[0].isRequired);
            const hasOptionalMissingArgsErrors = argErrors.some(e => e.error.type === 'missingArg' && !e.error.missingType[0].isRequired);
            const hasMissingArgsErrors = hasOptionalMissingArgsErrors || hasRequiredMissingArgsErrors;
            let missingArgsLegend = '';
            if (hasRequiredMissingArgsErrors) {
                missingArgsLegend += `\n${chalk_1.default.dim('Note: Lines with ')}${chalk_1.default.reset.greenBright('+')} ${chalk_1.default.dim('are required')}`;
            }
            if (hasOptionalMissingArgsErrors) {
                if (missingArgsLegend.length === 0) {
                    missingArgsLegend = '\n';
                }
                if (hasRequiredMissingArgsErrors) {
                    missingArgsLegend += chalk_1.default.dim(`, lines with ${chalk_1.default.green('?')} are optional`);
                }
                else {
                    missingArgsLegend += chalk_1.default.dim(`Note: Lines with ${chalk_1.default.green('?')} are optional`);
                }
                missingArgsLegend += chalk_1.default.dim('.');
            }
            const errorStr = `${stack}${indent_string_1.default(printJsonErrors_1.printJsonWithErrors(isTopLevelQuery ? { [topLevelQueryName]: select } : select, keyPaths, valuePaths, missingItems), indentValue).slice(indentValue)}${chalk_1.default.dim(afterLines)}

${argErrors
                .filter(e => e.error.type !== 'missingArg' || e.error.missingType[0].isRequired)
                .map(e => this.printArgError(e, hasMissingArgsErrors))
                .join('\n')}
${fieldErrors.map(this.printFieldError).join('\n')}${missingArgsLegend}\n`;
            return errorStr;
        };
        const error = new PhotonError(renderErrorStr());
        // @ts-ignore
        if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
            Object.defineProperty(error, 'render', {
                get: () => renderErrorStr,
                enumerable: false,
            });
        }
        throw error;
    }
    /**
     * As we're allowing both single objects and array of objects for list inputs, we need to remove incorrect
     * zero indexes from the path
     * @param inputPath e.g. ['where', 'AND', 0, 'id']
     * @param select select object
     */
    normalizePath(inputPath, select) {
        const path = inputPath.slice();
        const newPath = [];
        let key;
        let pointer = select;
        // tslint:disable-next-line:no-conditional-assignment
        while ((key = path.shift()) !== undefined) {
            if (!Array.isArray(pointer) && key === 0) {
                continue;
            }
            if (key === 'select') {
                // TODO: Remove this logic! It shouldn't be needed
                if (!pointer[key]) {
                    pointer = pointer.include;
                }
                else {
                    pointer = pointer[key];
                }
            }
            else {
                pointer = pointer[key];
            }
            newPath.push(key);
        }
        return newPath;
    }
}
exports.Document = Document;
class PhotonError extends Error {
}
class Field {
    constructor({ name, args, children, error, schemaField }) {
        this.name = name;
        this.args = args;
        this.children = children;
        this.error = error;
        this.schemaField = schemaField;
        this.hasInvalidChild = children
            ? children.some(child => Boolean(child.error || child.hasInvalidArg || child.hasInvalidChild))
            : false;
        this.hasInvalidArg = args ? args.hasInvalidArg : false;
    }
    toString() {
        let str = this.name;
        if (this.error) {
            return str + ' # INVALID_FIELD';
        }
        if (this.args && this.args.args && this.args.args.length > 0) {
            if (this.args.args.length === 1) {
                str += `(${this.args.toString()})`;
            }
            else {
                str += `(\n${indent_string_1.default(this.args.toString(), tab)}\n)`;
            }
        }
        if (this.children) {
            str += ` {
${indent_string_1.default(this.children.map(String).join('\n'), tab)}
}`;
        }
        return str;
    }
    collectErrors(prefix = 'select') {
        const fieldErrors = [];
        const argErrors = [];
        if (this.error) {
            fieldErrors.push({
                path: [this.name],
                error: this.error,
            });
        }
        // get all errors from fields
        if (this.children) {
            for (const child of this.children) {
                const errors = child.collectErrors(prefix);
                // Field -> Field always goes through a 'select'
                fieldErrors.push(...errors.fieldErrors.map(e => (Object.assign(Object.assign({}, e), { path: [this.name, prefix, ...e.path] }))));
                argErrors.push(...errors.argErrors.map(e => (Object.assign(Object.assign({}, e), { path: [this.name, prefix, ...e.path] }))));
            }
        }
        // get all errors from args
        if (this.args) {
            argErrors.push(...this.args.collectErrors().map(e => (Object.assign(Object.assign({}, e), { path: [this.name, ...e.path] }))));
        }
        return {
            fieldErrors,
            argErrors,
        };
    }
}
exports.Field = Field;
class Args {
    constructor(args = []) {
        this.args = args;
        this.hasInvalidArg = args ? args.some(arg => Boolean(arg.hasError)) : false;
    }
    toString() {
        if (this.args.length === 0) {
            return '';
        }
        return `${this.args
            .map(arg => arg.toString())
            .filter(a => a)
            .join('\n')}`;
    }
    collectErrors() {
        if (!this.hasInvalidArg) {
            return [];
        }
        return this.args.flatMap(arg => arg.collectErrors());
    }
}
exports.Args = Args;
/**
 * Custom stringify which turns undefined into null - needed by GraphQL
 * @param obj to stringify
 * @param _
 * @param tab
 */
function stringify(obj, _, tabbing, isEnum) {
    if (obj === undefined) {
        return null;
    }
    if (obj === null) {
        return 'null';
    }
    if (isEnum && typeof obj === 'string') {
        return obj;
    }
    if (isEnum && Array.isArray(obj)) {
        return `[${obj.join(', ')}]`;
    }
    return JSON.stringify(obj, _, tabbing);
}
class Arg {
    constructor({ key, value, argType, isEnum = false, error, schemaArg }) {
        this.key = key;
        this.value = value;
        this.argType = argType;
        this.isEnum = isEnum;
        this.error = error;
        this.schemaArg = schemaArg;
        this.hasError =
            Boolean(error) ||
                (value instanceof Args ? value.hasInvalidArg : false) ||
                (Array.isArray(value) && value.some(v => (v instanceof Args ? v.hasInvalidArg : false)));
    }
    _toString(value, key) {
        if (typeof value === 'undefined') {
            return undefined;
        }
        if (value instanceof Args) {
            return `${key}: {
${indent_string_1.default(value.toString(), 2)}
}`;
        }
        if (Array.isArray(value)) {
            const isScalar = !value.some(v => typeof v === 'object');
            return `${key}: [${isScalar ? '' : '\n'}${indent_string_1.default(value
                .map(nestedValue => {
                if (nestedValue instanceof Args) {
                    return `{\n${indent_string_1.default(nestedValue.toString(), tab)}\n}`;
                }
                return stringify(nestedValue, null, 2, this.isEnum);
            })
                .join(`,${isScalar ? ' ' : '\n'}`), isScalar ? 0 : tab)}${isScalar ? '' : '\n'}]`;
        }
        return `${key}: ${stringify(value, null, 2, this.isEnum)}`;
    }
    toString() {
        return this._toString(this.value, this.key);
    }
    collectErrors() {
        if (!this.hasError) {
            return [];
        }
        const errors = [];
        // add the own arg
        if (this.error) {
            errors.push({
                error: this.error,
                path: [this.key],
            });
        }
        if (Array.isArray(this.value)) {
            errors.push(...this.value.flatMap((val, index) => {
                if (!val.collectErrors) {
                    return [];
                }
                return val.collectErrors().map(e => {
                    return Object.assign(Object.assign({}, e), { path: [this.key, index, ...e.path] });
                });
            }));
        }
        // collect errors of children if there are any
        if (this.value instanceof Args) {
            errors.push(...this.value.collectErrors().map(e => (Object.assign(Object.assign({}, e), { path: [this.key, ...e.path] }))));
        }
        return errors;
    }
}
exports.Arg = Arg;
function makeDocument({ dmmf, rootTypeName, rootField, select }) {
    const rootType = rootTypeName === 'query' ? dmmf.queryType : dmmf.mutationType;
    // Create a fake toplevel field for easier implementation
    const fakeRootField = {
        args: [],
        outputType: {
            isList: false,
            isRequired: true,
            type: rootType,
            kind: 'object',
        },
        name: rootTypeName,
    };
    const children = selectionToFields(dmmf, { [rootField]: select }, fakeRootField, [rootTypeName]);
    return new Document(rootTypeName, children);
}
exports.makeDocument = makeDocument;
function transformDocument(document) {
    function transformWhereArgs(args) {
        return new Args(args.args.flatMap(ar => {
            if (isArgsArray(ar.value)) {
                // long variable name to prevent shadowing
                const value = ar.value.map(argsInstance => {
                    return transformWhereArgs(argsInstance);
                });
                return new Arg(Object.assign(Object.assign({}, ar), { value }));
            }
            else if (ar.value instanceof Args) {
                if (ar.schemaArg && !ar.schemaArg.isRelationFilter) {
                    return ar.value.args.map(a => {
                        return new Arg({
                            key: getFilterArgName(ar.key, a.key),
                            value: a.value,
                            /**
                             * This is an ugly hack. It assumes, that deep somewhere must be a valid inputType for
                             * this argument
                             */
                            argType: deep_set_1.deepGet(ar, ['value', 'args', '0', 'argType']),
                            schemaArg: a.schemaArg,
                        });
                    });
                }
            }
            return [ar];
        }));
    }
    function transformOrderArg(arg) {
        if (arg.value instanceof Args) {
            const orderArg = arg.value.args[0];
            return new Arg(Object.assign(Object.assign({}, arg), { isEnum: true, value: `${orderArg.key}_${orderArg.value.toString().toUpperCase()}` }));
        }
        return arg;
    }
    return visit_1.visit(document, {
        Arg: {
            enter(arg) {
                const { argType, schemaArg } = arg;
                if (!argType) {
                    return undefined;
                }
                if (isInputArgType(argType)) {
                    if (argType.isOrderType) {
                        return transformOrderArg(arg);
                    }
                    if (argType.isWhereType && schemaArg) {
                        let value = arg.value;
                        if (isArgsArray(arg.value)) {
                            value = arg.value.map(val => transformWhereArgs(val));
                        }
                        else if (arg.value instanceof Args) {
                            value = transformWhereArgs(arg.value);
                        }
                        return new Arg(Object.assign(Object.assign({}, arg), { value }));
                    }
                }
                return undefined;
            },
        },
    });
}
exports.transformDocument = transformDocument;
function isArgsArray(input) {
    if (Array.isArray(input)) {
        return input.every(arg => arg instanceof Args);
    }
    return false;
}
function getFilterArgName(arg, filter) {
    if (filter === 'equals') {
        return arg;
    }
    return `${arg}_${convertToSnakeCase(filter)}`;
}
function convertToSnakeCase(str) {
    return str
        .split(/(?=[A-Z])/)
        .join('_')
        .toLowerCase();
}
function selectionToFields(dmmf, selection, schemaField, path) {
    const outputType = schemaField.outputType.type;
    return Object.entries(selection).reduce((acc, [name, value]) => {
        const field = outputType.fields.find(f => f.name === name);
        if (!field) {
            // if the field name is incorrect, we ignore the args and child fields altogether
            acc.push(new Field({
                name,
                children: [],
                // @ts-ignore
                error: {
                    type: 'invalidFieldName',
                    modelName: outputType.name,
                    providedName: name,
                    didYouMean: common_1.getSuggestion(name, outputType.fields.map(f => f.name)),
                    outputType,
                },
            }));
            return acc;
        }
        if (typeof value !== 'boolean' && field.outputType.kind === 'scalar') {
            acc.push(new Field({
                name,
                children: [],
                error: {
                    type: 'invalidFieldType',
                    modelName: outputType.name,
                    fieldName: name,
                    providedValue: value,
                },
            }));
            return acc;
        }
        if (value === false) {
            return acc;
        }
        const transformedField = {
            name: field.name,
            fields: field.args,
        };
        const argsWithoutIncludeAndSelect = typeof value === 'object' ? omit_1.omit(value, ['include', 'select']) : undefined;
        const args = argsWithoutIncludeAndSelect
            ? objectToArgs(argsWithoutIncludeAndSelect, transformedField, [], typeof field === 'string' ? undefined : field.outputType.type)
            : undefined;
        const isRelation = field.outputType.kind === 'object';
        // TODO: use default selection for `include` again
        // check for empty select
        if (value) {
            if (value.select && value.include) {
                acc.push(new Field({
                    name,
                    children: [
                        new Field({
                            name: 'include',
                            args: new Args(),
                            error: {
                                type: 'includeAndSelect',
                                field,
                            },
                        }),
                    ],
                }));
            }
            else if (value.include) {
                const keys = Object.keys(value.include);
                if (keys.length === 0) {
                    acc.push(new Field({
                        name,
                        children: [
                            new Field({
                                name: 'include',
                                args: new Args(),
                                error: {
                                    type: 'emptyInclude',
                                    field,
                                },
                            }),
                        ],
                    }));
                    return acc;
                }
                // TODO: unify with select validation logic
                /**
                 * Error handling for `include` statements
                 */
                if (field.outputType.kind === 'object') {
                    const fieldOutputType = field.outputType.type;
                    const allowedKeys = fieldOutputType.fields.filter(f => f.outputType.kind === 'object').map(f => f.name);
                    const invalidKeys = keys.filter(key => !allowedKeys.includes(key));
                    if (invalidKeys.length > 0) {
                        acc.push(...invalidKeys.map(invalidKey => new Field({
                            name: invalidKey,
                            children: [
                                new Field({
                                    name: invalidKey,
                                    args: new Args(),
                                    error: {
                                        type: 'invalidFieldName',
                                        modelName: fieldOutputType.name,
                                        outputType: fieldOutputType,
                                        providedName: invalidKey,
                                        didYouMean: common_1.getSuggestion(invalidKey, allowedKeys) || undefined,
                                        isInclude: true,
                                        isIncludeScalar: fieldOutputType.fields.some(f => f.name === invalidKey),
                                    },
                                }),
                            ],
                        })));
                        return acc;
                    }
                }
            }
            else if (value.select) {
                const values = Object.values(value.select);
                if (values.length === 0) {
                    acc.push(new Field({
                        name,
                        children: [
                            new Field({
                                name: 'select',
                                args: new Args(),
                                error: {
                                    type: 'emptySelect',
                                    field,
                                },
                            }),
                        ],
                    }));
                    return acc;
                }
                // check if there is at least one truthy value
                const truthyValues = values.filter(v => v);
                if (truthyValues.length === 0) {
                    acc.push(new Field({
                        name,
                        children: [
                            new Field({
                                name: 'select',
                                args: new Args(),
                                error: {
                                    type: 'noTrueSelect',
                                    field,
                                },
                            }),
                        ],
                    }));
                    return acc;
                }
            }
        }
        // either use select or default selection, but not both at the same time
        const defaultSelection = isRelation ? getDefaultSelection(field.outputType.type) : null;
        let select = defaultSelection;
        if (value) {
            if (value.select) {
                select = value.select;
            }
            else if (value.include) {
                select = deep_extend_1.deepExtend(defaultSelection, value.include);
            }
        }
        const children = select !== false && isRelation ? selectionToFields(dmmf, select, field, [...path, name]) : undefined;
        acc.push(new Field({ name, args, children, schemaField: field }));
        return acc;
    }, []);
}
exports.selectionToFields = selectionToFields;
function getDefaultSelection(outputType) {
    return outputType.fields.reduce((acc, f) => {
        if (f.outputType.kind === 'scalar' || f.outputType.kind === 'enum') {
            acc[f.name] = true;
        }
        else {
            // otherwise field is a relation. Only continue if it's an embedded type
            // as normal types don't end up in the default selection
            if (f.outputType.type.isEmbedded) {
                acc[f.name] = { select: getDefaultSelection(f.outputType.type) };
            }
        }
        return acc;
    }, {});
}
function getInvalidTypeArg(key, value, arg, bestFittingType) {
    const arrg = new Arg({
        key,
        value,
        isEnum: bestFittingType.kind === 'enum',
        argType: bestFittingType.type,
        error: {
            type: 'invalidType',
            providedValue: value,
            argName: key,
            requiredType: {
                inputType: arg.inputType,
                bestFittingType,
            },
        },
    });
    return arrg;
}
function hasCorrectScalarType(value, arg, inputType) {
    const { type } = inputType;
    const isList = arg.inputType[0].isList;
    const expectedType = common_1.wrapWithList(common_1.stringifyGraphQLType(type), isList);
    const graphQLType = common_1.getGraphQLType(value, type);
    if (isList && graphQLType === 'List<>') {
        return true;
    }
    // DateTime is a subset of string
    if (graphQLType === 'DateTime' && expectedType === 'String') {
        return true;
    }
    if (graphQLType === 'List<DateTime>' && expectedType === 'List<String>') {
        return true;
    }
    // UUID is a subset of string
    if (graphQLType === 'UUID' && expectedType === 'String') {
        return true;
    }
    if (graphQLType === 'List<UUID>' && expectedType === 'List<String>') {
        return true;
    }
    if (graphQLType === 'String' && expectedType === 'ID') {
        return true;
    }
    if (graphQLType === 'List<String>' && expectedType === 'List<ID>') {
        return true;
    }
    // Int is a subset of Float
    if (graphQLType === 'Int' && expectedType === 'Float') {
        return true;
    }
    if (graphQLType === 'List<Int>' && expectedType === 'List<Float>') {
        return true;
    }
    // Int is a subset of Long
    if (graphQLType === 'Int' && expectedType === 'Long') {
        return true;
    }
    if (graphQLType === 'List<Int>' && expectedType === 'List<Long>') {
        return true;
    }
    if (graphQLType === expectedType) {
        return true;
    }
    if (!inputType.isRequired && value === null) {
        return true;
    }
    return false;
}
const cleanObject = obj => filterObject_1.filterObject(obj, (k, v) => v !== undefined);
function valueToArg(key, value, arg) {
    const argInputType = arg.inputType[0];
    if (typeof value === 'undefined') {
        // the arg is undefined and not required - we're fine
        if (!argInputType.isRequired) {
            return null;
        }
        // the provided value is 'undefined' but shouldn't be
        return new Arg({
            key,
            value,
            isEnum: argInputType.kind === 'enum',
            error: {
                type: 'missingArg',
                missingName: key,
                missingType: arg.inputType,
                atLeastOne: false,
                atMostOne: false,
            },
        });
    }
    // then the first
    if (!argInputType.isList) {
        const args = arg.inputType.map(t => {
            if (isInputArgType(t.type)) {
                if (typeof value !== 'object') {
                    return getInvalidTypeArg(key, value, arg, t);
                }
                else {
                    const val = cleanObject(value);
                    let error;
                    const keys = Object.keys(val || {});
                    const numKeys = keys.length;
                    if (numKeys === 0 && t.type.atLeastOne) {
                        error = {
                            type: 'atLeastOne',
                            key,
                            inputType: t.type,
                        };
                    }
                    if (numKeys > 1 && t.type.atMostOne) {
                        error = {
                            type: 'atMostOne',
                            key,
                            inputType: t.type,
                            providedKeys: keys,
                        };
                    }
                    return new Arg({
                        key,
                        value: val === null ? null : objectToArgs(val, t.type, arg.inputType),
                        isEnum: argInputType.kind === 'enum',
                        error,
                        argType: t.type,
                        schemaArg: arg,
                    });
                }
            }
            else {
                return scalarToArg(key, value, arg, t);
            }
        });
        // is it just one possible type? Then no matter what just return that one
        if (args.length === 1) {
            return args[0];
        }
        // do we have more then one, but does it fit one of the args? Then let's just take that one arg
        const argWithoutError = args.find(a => !a.hasError);
        if (argWithoutError) {
            return argWithoutError;
        }
        const hasSameKind = (argType, val) => {
            if (val === null && (argType === 'null' || !isInputArgType(argType))) {
                return true;
            }
            return isInputArgType(argType) ? typeof val === 'object' : typeof val !== 'object';
        };
        /**
         * If there are more than 1 args, do the following:
         * First check if there are any possible arg types which at least have the
         * correct base type (scalar, null or object)
         * Take either these, or if they don't exist just again the normal args and
         * take the arg with the minimum amount of errors
         */
        if (args.length > 1) {
            const argsWithSameKind = args.filter(a => hasSameKind(a.argType, value));
            const argsToFilter = argsWithSameKind.length > 0 ? argsWithSameKind : args;
            const argWithMinimumErrors = argsToFilter.reduce((acc, curr) => {
                const numErrors = curr.collectErrors().length;
                if (numErrors < acc.numErrors) {
                    return {
                        arg: curr,
                        numErrors,
                    };
                }
                return acc;
            }, {
                arg: null,
                numErrors: Infinity,
            });
            return argWithMinimumErrors.arg;
        }
    }
    if (arg.inputType.length > 1) {
        throw new Error(`List types with union input types are not supported`);
    }
    // the provided arg should be a list, but isn't
    // that's fine for us as we can just turn this into a list with a single item
    // and GraphQL even allows this. We're going the conservative route though
    // and actually generate the [] around the value
    if (!Array.isArray(value)) {
        value = [value];
    }
    if (argInputType.kind === 'enum' || argInputType.kind === 'scalar') {
        // if no value is incorrect
        return scalarToArg(key, value, arg, argInputType);
    }
    const inputType = argInputType.type;
    const hasAtLeastOneError = inputType.atLeastOne ? value.some(v => Object.keys(cleanObject(v)).length === 0) : false;
    const err = hasAtLeastOneError
        ? {
            inputType,
            key,
            type: 'atLeastOne',
        }
        : undefined;
    return new Arg({
        key,
        value: value.map(v => {
            if (typeof v !== 'object' || !value) {
                return getInvalidTypeArg(key, v, arg, argInputType);
            }
            return objectToArgs(v, argInputType.type);
        }),
        isEnum: false,
        argType: argInputType.type,
        schemaArg: arg,
        error: err,
    });
}
function isInputArgType(argType) {
    if (typeof argType === 'string') {
        return false;
    }
    if (argType.hasOwnProperty('values')) {
        return false;
    }
    return true;
}
exports.isInputArgType = isInputArgType;
function scalarToArg(key, value, arg, inputType) {
    if (hasCorrectScalarType(value, arg, inputType)) {
        return new Arg({ key, value, isEnum: arg.inputType[0].kind === 'enum', argType: inputType.type, schemaArg: arg });
    }
    return getInvalidTypeArg(key, value, arg, inputType);
}
function objectToArgs(initialObj, inputType, possibilities, outputType) {
    // filter out undefined values and treat them if they weren't provided
    // TODO: think about using JSON.parse(JSON.stringify()) upfront instead to simplify things
    const obj = cleanObject(initialObj);
    const { fields: args } = inputType;
    const requiredArgs = args.filter(arg => arg.inputType.some(t => t.isRequired)).map(arg => [arg.name, undefined]);
    const entries = common_1.unionBy(Object.entries(obj || {}), requiredArgs, a => a[0]);
    const argsList = entries.reduce((acc, [argName, value]) => {
        const schemaArg = args.find(a => a.name === argName);
        if (!schemaArg) {
            const didYouMeanField = typeof value === 'boolean' && outputType && outputType.fields.some(f => f.name === argName) ? argName : null;
            acc.push(new Arg({
                key: argName,
                value,
                error: {
                    type: 'invalidName',
                    providedName: argName,
                    providedValue: value,
                    didYouMeanField,
                    didYouMeanArg: (!didYouMeanField && common_1.getSuggestion(argName, [...args.map(a => a.name), 'select'])) || undefined,
                    originalType: inputType,
                    possibilities,
                    outputType,
                },
            }));
            return acc;
        }
        const arg = valueToArg(argName, value, schemaArg);
        if (arg) {
            acc.push(arg);
        }
        return acc;
    }, []);
    // Also show optional neighbour args, if there is any arg missing
    if ((entries.length === 0 && inputType.atLeastOne) ||
        argsList.find(arg => arg.error && arg.error.type === 'missingArg')) {
        const optionalMissingArgs = inputType.fields.filter(arg => !entries.some(([entry]) => entry === arg.name));
        argsList.push(...optionalMissingArgs.map(arg => {
            const argInputType = arg.inputType[0];
            return new Arg({
                key: arg.name,
                value: undefined,
                isEnum: argInputType.kind === 'enum',
                error: {
                    type: 'missingArg',
                    missingName: arg.name,
                    missingType: arg.inputType,
                    atLeastOne: inputType.atLeastOne || false,
                    atMostOne: inputType.atMostOne || false,
                },
            });
        }));
    }
    return new Args(argsList);
}
/**
 * Unpacks the result of a data object and maps DateTime fields to instances of `Date` inplace
 * @param options: UnpackOptions
 */
function unpack({ document, path, data }) {
    const result = deep_set_1.deepGet(data, path);
    if (result === 'undefined') {
        return null;
    }
    if (typeof result !== 'object') {
        return result;
    }
    const field = getField(document, path);
    return mapDates({ field, data: result });
}
exports.unpack = unpack;
function mapDates({ field, data }) {
    if (!data || typeof data !== 'object' || !field.children || !field.schemaField) {
        return data;
    }
    for (const child of field.children) {
        if (child.schemaField && child.schemaField.outputType.type === 'DateTime') {
            if (Array.isArray(data)) {
                for (const entry of data) {
                    // in the very unlikely case, that a field is not there in the result, ignore it
                    if (typeof entry[child.name] !== 'undefined') {
                        entry[child.name] = entry[child.name] ? new Date(entry[child.name]) : entry[child.name];
                    }
                }
            }
            else {
                // same here, ignore it if it's undefined
                if (typeof data[child.name] !== 'undefined') {
                    data[child.name] = data[child.name] ? new Date(data[child.name]) : data[child.name];
                }
            }
        }
        if (child.schemaField && child.schemaField.outputType.kind === 'object') {
            if (Array.isArray(data)) {
                data.forEach(entry => mapDates({ field: child, data: entry[child.name] }));
            }
            else {
                mapDates({ field: child, data: data[child.name] });
            }
        }
    }
    return data;
}
exports.mapDates = mapDates;
function getField(document, path) {
    const todo = path.slice(); // let's create a copy to not fiddle with the input argument
    const firstElement = todo.shift();
    let pointer = document.children.find(c => c.name === firstElement);
    if (!pointer) {
        throw new Error(`Could not find field ${firstElement} in document ${document}`);
    }
    while (todo.length > 0) {
        const key = todo.shift();
        if (!pointer.children) {
            throw new Error(`Can't get children for field ${pointer} with child ${key}`);
        }
        const child = pointer.children.find(c => c.name === key);
        if (!child) {
            throw new Error(`Can't find child ${key} of field ${pointer}`);
        }
        pointer = child;
    }
    return pointer;
}
exports.getField = getField;
//# sourceMappingURL=query.js.map