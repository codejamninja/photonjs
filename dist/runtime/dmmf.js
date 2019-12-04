"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./utils/common");
class DMMFClass {
    constructor({ datamodel, schema, mappings }) {
        this.outputTypeMap = {};
        this.outputTypeToMergedOutputType = (outputType) => {
            const model = this.modelMap[outputType.name];
            return Object.assign(Object.assign({}, outputType), { isEmbedded: model ? model.isEmbedded : false, fields: outputType.fields });
        };
        this.datamodel = datamodel;
        this.schema = schema;
        this.mappings = mappings;
        this.enumMap = this.getEnumMap();
        this.queryType = this.getQueryType();
        this.mutationType = this.getMutationType();
        this.modelMap = this.getModelMap();
        this.outputTypes = this.getOutputTypes();
        this.resolveOutputTypes(this.outputTypes);
        this.inputTypes = this.schema.inputTypes;
        this.resolveInputTypes(this.inputTypes);
        this.inputTypeMap = this.getInputTypeMap();
        this.resolveFieldArgumentTypes(this.outputTypes, this.inputTypeMap);
        this.outputTypeMap = this.getMergedOutputTypeMap();
        // needed as references are not kept
        this.queryType = this.outputTypeMap.Query;
        this.mutationType = this.outputTypeMap.Mutation;
        this.outputTypes = this.outputTypes;
    }
    getField(fieldName) {
        return (
        // TODO: create lookup table for Query and Mutation
        this.queryType.fields.find(f => f.name === fieldName) || this.mutationType.fields.find(f => f.name === fieldName));
    }
    resolveOutputTypes(types) {
        for (const typeA of types) {
            for (const fieldA of typeA.fields) {
                for (const typeB of types) {
                    if (typeof fieldA.outputType.type === 'string') {
                        if (fieldA.outputType.type === typeB.name) {
                            fieldA.outputType.type = typeB;
                        }
                        else if (this.enumMap[fieldA.outputType.type]) {
                            fieldA.outputType.type = this.enumMap[fieldA.outputType.type];
                        }
                    }
                }
            }
        }
    }
    resolveInputTypes(types) {
        for (const typeA of types) {
            for (const fieldA of typeA.fields) {
                for (const typeB of types) {
                    fieldA.inputType.forEach((inputType, index) => {
                        if (typeof inputType.type === 'string') {
                            if (inputType.type === typeB.name) {
                                fieldA.inputType[index].type = typeB;
                            }
                            else if (this.enumMap[inputType.type]) {
                                fieldA.inputType[index].type = this.enumMap[inputType.type];
                            }
                        }
                    });
                }
            }
        }
    }
    resolveFieldArgumentTypes(types, inputTypeMap) {
        for (const type of types) {
            for (const field of type.fields) {
                for (const arg of field.args) {
                    arg.inputType.forEach((t, index) => {
                        if (typeof t.type === 'string') {
                            if (inputTypeMap[t.type]) {
                                arg.inputType[index].type = inputTypeMap[t.type];
                            }
                            else if (this.enumMap[t.type]) {
                                arg.inputType[index].type = this.enumMap[t.type];
                            }
                        }
                    });
                }
            }
        }
    }
    getQueryType() {
        return this.schema.outputTypes.find(t => t.name === 'Query');
    }
    getMutationType() {
        return this.schema.outputTypes.find(t => t.name === 'Mutation');
    }
    getOutputTypes() {
        return this.schema.outputTypes.map(this.outputTypeToMergedOutputType);
    }
    getEnumMap() {
        return common_1.keyBy(this.schema.enums, e => e.name);
    }
    getModelMap() {
        return common_1.keyBy(this.datamodel.models, m => m.name);
    }
    getMergedOutputTypeMap() {
        return common_1.keyBy(this.outputTypes, t => t.name);
    }
    getInputTypeMap() {
        return common_1.keyBy(this.schema.inputTypes, t => t.name);
    }
}
exports.DMMFClass = DMMFClass;
//# sourceMappingURL=dmmf.js.map