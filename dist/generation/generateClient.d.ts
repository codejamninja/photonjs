import { BinaryPaths, DataSource, DMMF, GeneratorConfig } from '@prisma/generator-helper';
import { DMMF as PhotonDMMF } from '../runtime/dmmf-types';
import { Dictionary } from '../runtime/utils/common';
export interface GenerateClientOptions {
    datamodel: string;
    datamodelPath: string;
    browser?: boolean;
    schemaDir?: string;
    transpile?: boolean;
    runtimePath?: string;
    outputDir: string;
    version?: string;
    generator?: GeneratorConfig;
    dmmf: DMMF.Document;
    datasources: DataSource[];
    binaryPaths: BinaryPaths;
    testMode?: boolean;
    copyRuntime?: boolean;
}
export interface BuildClientResult {
    fileMap: Dictionary<string>;
    photonDmmf: PhotonDMMF.Document;
}
export declare function buildClient({ datamodel, schemaDir, transpile, runtimePath, browser, binaryPaths, outputDir, generator, version, dmmf, datasources, }: GenerateClientOptions): Promise<BuildClientResult>;
export declare function generateClient({ datamodel, datamodelPath, schemaDir, outputDir, transpile, runtimePath, browser, version, generator, dmmf, datasources, binaryPaths, testMode, copyRuntime, }: GenerateClientOptions): Promise<BuildClientResult | undefined>;