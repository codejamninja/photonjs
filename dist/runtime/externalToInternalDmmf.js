"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pluralize_1 = __importDefault(require("pluralize"));
const common_1 = require("./utils/common");
function transformFieldKind(model) {
    return Object.assign(Object.assign({}, model), { fields: model.fields.map(field => (Object.assign(Object.assign({}, field), { kind: field.kind === 'relation' ? 'object' : field.kind }))) });
}
function transformDatamodel(datamodel) {
    return {
        enums: datamodel.enums,
        models: datamodel.models.map(transformFieldKind),
    };
}
/**
 * Turns type: string into type: string[] for all args in order to support union input types
 * @param document
 */
function externalToInternalDmmf(document) {
    return {
        datamodel: transformDatamodel(document.datamodel),
        mappings: getMappings(document.mappings),
        schema: transformSchema(document.schema),
    };
}
exports.externalToInternalDmmf = externalToInternalDmmf;
function transformSchema(schema) {
    return {
        enums: schema.enums,
        inputTypes: schema.inputTypes.map(t => (Object.assign(Object.assign({}, t), { fields: transformArgs(t.fields) }))),
        outputTypes: schema.outputTypes.map(o => (Object.assign(Object.assign({}, o), { fields: o.fields.map(f => (Object.assign(Object.assign({}, f), { args: transformArgs(f.args) }))) }))),
    };
}
function transformArgs(args) {
    return args.map(transformArg);
}
function fixOrderByEnum(arg) {
    if (arg.name === 'orderBy' && arg.inputType.type.endsWith('OrderByInput')) {
        return {
            name: arg.name,
            inputType: {
                isList: arg.inputType.isList,
                isRequired: arg.inputType.isRequired,
                type: arg.inputType.type,
                kind: 'object',
            },
        };
    }
    return arg;
}
function transformArg(argBefore) {
    const arg = fixOrderByEnum(argBefore);
    return {
        name: arg.name,
        inputType: [arg.inputType],
    };
}
function getMappings(mappings) {
    return mappings.map((mapping) => ({
        model: mapping.model,
        plural: pluralize_1.default(common_1.lowerCase(mapping.model)),
        findOne: mapping.findSingle || mapping.findOne,
        findMany: mapping.findMany,
        create: mapping.createOne || mapping.createSingle || mapping.create,
        delete: mapping.deleteOne || mapping.deleteSingle || mapping.delete,
        update: mapping.updateOne || mapping.updateSingle || mapping.update,
        deleteMany: mapping.deleteMany,
        updateMany: mapping.updateMany,
        upsert: mapping.upsertOne || mapping.upsertSingle || mapping.upsert,
        aggregate: mapping.aggregate,
    }));
}
//# sourceMappingURL=externalToInternalDmmf.js.map