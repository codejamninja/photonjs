import { DMMFClass } from '../runtime/dmmf';
import { DMMF } from '../runtime/dmmf-types';
export declare enum Projection {
    select = "select",
    include = "include"
}
export declare function getScalarsName(modelName: string): string;
export declare function getPayloadName(modelName: string, projection: Projection): string;
export declare function getSelectName(modelName: string): string;
export declare function getIncludeName(modelName: string): string;
export declare function getDefaultName(modelName: string): string;
export declare function getFieldArgName(field: DMMF.SchemaField, projection?: Projection): string;
export declare function getArgName(name: string, isList: boolean, projection?: Projection): string;
export declare function getModelArgName(modelName: string, projection?: Projection, action?: DMMF.ModelAction): string;
export declare function getDefaultArgName(dmmf: DMMFClass, modelName: string, action: DMMF.ModelAction): string;
export declare function getOperation(action: DMMF.ModelAction): 'query' | 'mutation';
/**
 * Used to render the initial client args
 * @param modelName
 * @param fieldName
 * @param mapping
 */
export declare function renderInitialClientArgs(actionName: DMMF.ModelAction, fieldName: string, mapping: DMMF.Mapping): string;
export declare function getFieldTypeName(field: DMMF.SchemaField): string;
export declare function getType(name: string, isList: boolean, isOptional?: boolean): string;
export declare function getFieldType(field: DMMF.SchemaField): string;
interface SelectReturnTypeOptions {
    name: string;
    actionName: DMMF.ModelAction;
    renderPromise?: boolean;
    hideCondition?: boolean;
    isField?: boolean;
    fieldName?: string;
    projection: Projection;
}
/**
 * Get the complicated extract output
 * @param name Model name
 * @param actionName action name
 */
export declare function getSelectReturnType({ name, actionName, renderPromise, hideCondition, isField, fieldName, }: SelectReturnTypeOptions): string;
export declare function isQueryAction(action: DMMF.ModelAction, operation: 'query' | 'mutation'): boolean;
export declare function capitalize(str: string): string;
export declare function indentAllButFirstLine(str: string, indentation: number): string;
export declare function getRelativePathResolveStatement(outputDir: string, cwd?: string): string;
export {};