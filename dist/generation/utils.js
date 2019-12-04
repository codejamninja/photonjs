"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const indent_string_1 = __importDefault(require("indent-string"));
const path_1 = __importDefault(require("path"));
const dmmf_types_1 = require("../runtime/dmmf-types");
var Projection;
(function (Projection) {
    Projection["select"] = "select";
    Projection["include"] = "include";
})(Projection = exports.Projection || (exports.Projection = {}));
function getScalarsName(modelName) {
    return `${modelName}Scalars`;
}
exports.getScalarsName = getScalarsName;
function getPayloadName(modelName, projection) {
    return `${modelName}Get${capitalize(projection)}Payload`;
}
exports.getPayloadName = getPayloadName;
// export function getExtractName(modelName: string, projection: Projection) {
//   return `Extract${modelName}${capitalize(projection)}`
// }
function getSelectName(modelName) {
    return `${modelName}Select`;
}
exports.getSelectName = getSelectName;
function getIncludeName(modelName) {
    return `${modelName}Include`;
}
exports.getIncludeName = getIncludeName;
function getDefaultName(modelName) {
    return `${modelName}Default`;
}
exports.getDefaultName = getDefaultName;
function getFieldArgName(field, projection) {
    return getArgName(field.outputType.type.name, field.outputType.isList, projection);
}
exports.getFieldArgName = getFieldArgName;
function getArgName(name, isList, projection) {
    const projectionString = projection ? capitalize(projection) : '';
    if (!isList) {
        return `${name}${projectionString}Args`;
    }
    return `FindMany${name}${projectionString}Args`;
}
exports.getArgName = getArgName;
// we need names for all top level args,
// as GraphQL doesn't have the concept of unnamed args
function getModelArgName(modelName, projection, action) {
    const projectionName = projection ? capitalize(projection) : '';
    if (!action) {
        return `${modelName}${projectionName}Args`;
    }
    switch (action) {
        case dmmf_types_1.DMMF.ModelAction.findMany:
            return `FindMany${modelName}${projectionName}Args`;
        case dmmf_types_1.DMMF.ModelAction.findOne:
            return `FindOne${modelName}${projectionName}Args`;
        case dmmf_types_1.DMMF.ModelAction.upsert:
            return `${modelName}${projectionName}UpsertArgs`;
        case dmmf_types_1.DMMF.ModelAction.update:
            return `${modelName}${projectionName}UpdateArgs`;
        case dmmf_types_1.DMMF.ModelAction.updateMany:
            return `${modelName}${projectionName}UpdateManyArgs`;
        case dmmf_types_1.DMMF.ModelAction.delete:
            return `${modelName}${projectionName}DeleteArgs`;
        case dmmf_types_1.DMMF.ModelAction.create:
            return `${modelName}${projectionName}CreateArgs`;
        case dmmf_types_1.DMMF.ModelAction.deleteMany:
            return `${modelName}${projectionName}DeleteManyArgs`;
    }
}
exports.getModelArgName = getModelArgName;
function getDefaultArgName(dmmf, modelName, action) {
    const mapping = dmmf.mappings.find(m => m.model === modelName);
    const fieldName = mapping[action];
    const operation = getOperation(action);
    const queryType = operation === 'query' ? dmmf.queryType : dmmf.mutationType;
    const field = queryType.fields.find(f => f.name === fieldName);
    return field.args[0].inputType[0].type.name;
}
exports.getDefaultArgName = getDefaultArgName;
function getOperation(action) {
    if (action === dmmf_types_1.DMMF.ModelAction.findMany || action === dmmf_types_1.DMMF.ModelAction.findOne) {
        return 'query';
    }
    return 'mutation';
}
exports.getOperation = getOperation;
/**
 * Used to render the initial client args
 * @param modelName
 * @param fieldName
 * @param mapping
 */
function renderInitialClientArgs(actionName, fieldName, mapping) {
    return `
  dmmf,
  fetcher,
  '${getOperation(actionName)}',
  '${fieldName}',
  '${mapping.plural}.${actionName}',
  args,
  []\n`;
}
exports.renderInitialClientArgs = renderInitialClientArgs;
function getFieldTypeName(field) {
    if (typeof field.outputType.type === 'string') {
        return field.outputType.type;
    }
    return field.outputType.type.name;
}
exports.getFieldTypeName = getFieldTypeName;
function getType(name, isList, isOptional) {
    return name + (isList ? '[]' : '') + (isOptional ? ' | null' : '');
}
exports.getType = getType;
function getFieldType(field) {
    return getType(getFieldTypeName(field), field.outputType.isList);
}
exports.getFieldType = getFieldType;
/**
 * Get the complicated extract output
 * @param name Model name
 * @param actionName action name
 */
function getSelectReturnType({ name, actionName, renderPromise = true, hideCondition = false, isField = false, fieldName, }) {
    const isList = actionName === dmmf_types_1.DMMF.ModelAction.findMany;
    const selectArgName = isField
        ? getArgName(name, isList, Projection.select)
        : getModelArgName(name, Projection.select, actionName);
    const includeArgName = isField
        ? getArgName(name, isList, Projection.include)
        : getModelArgName(name, Projection.include, actionName);
    const requiredArgName = getModelArgName(name, undefined, actionName) + 'Required';
    const requiredCheck = `T extends ${requiredArgName} ? 'Please either choose \`select\` or \`include\`' : `;
    if (actionName === 'deleteMany' || actionName === 'updateMany') {
        return `Promise<BatchPayload>`;
    }
    /**
     * Important: We handle findMany or isList special, as we don't want chaining from there
     */
    if (isList || hideCondition) {
        const listOpen = isList ? 'Array<' : '';
        const listClose = isList ? '>' : '';
        const promiseOpen = renderPromise ? 'Promise<' : '';
        const promiseClose = renderPromise ? '>' : '';
        const renderType = (projection) => `${promiseOpen}${listOpen}${getPayloadName(name, projection)}<Extract${getModelArgName(name, projection, actionName)}<T>${actionName === 'findOne' ? ' | null' : ''}>${listClose}${promiseClose}`;
        return `${requiredCheck}T extends ${selectArgName}
? ${renderType(Projection.select)} : T extends ${includeArgName}
? ${renderType(Projection.include)} : ${promiseOpen}${listOpen}${name}${promiseClose}${listClose}`;
    }
    const selectType = `${renderPromise ? 'Promise<' : ''}${getPayloadName(name, Projection.select)}<Extract${selectArgName}<T>${renderPromise ? '>' : ''}${actionName === 'findOne' ? ' | null' : ''}>`;
    const includeType = `${renderPromise ? 'Promise<' : ''}${getPayloadName(name, Projection.include)}<Extract${includeArgName}<T>${renderPromise ? '>' : ''}${actionName === 'findOne' ? ' | null' : ''}>`;
    return `${requiredCheck}T extends ${selectArgName} ? ${selectType}
: T extends ${includeArgName} ? ${includeType} : ${name}Client<${getType(name, isList)}${actionName === 'findOne' ? ' | null' : ''}>`;
}
exports.getSelectReturnType = getSelectReturnType;
function isQueryAction(action, operation) {
    if (!(action in dmmf_types_1.DMMF.ModelAction)) {
        return false;
    }
    const result = action === dmmf_types_1.DMMF.ModelAction.findOne || action === dmmf_types_1.DMMF.ModelAction.findMany;
    return operation === 'query' ? result : !result;
}
exports.isQueryAction = isQueryAction;
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}
exports.capitalize = capitalize;
function indentAllButFirstLine(str, indentation) {
    const lines = str.split('\n');
    return lines[0] + '\n' + indent_string_1.default(lines.slice(1).join('\n'), indentation);
}
exports.indentAllButFirstLine = indentAllButFirstLine;
function getRelativePathResolveStatement(outputDir, cwd) {
    if (!cwd) {
        return 'undefined';
    }
    return `path.resolve(__dirname, ${JSON.stringify(path_1.default.relative(outputDir, cwd))})`;
}
exports.getRelativePathResolveStatement = getRelativePathResolveStatement;
//# sourceMappingURL=utils.js.map