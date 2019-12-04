import { DMMF } from '@prisma/generator-helper'
import { getDMMF as getRawDMMF, GetDMMFOptions } from '@prisma/sdk'
import { DMMF as PhotonDMMF } from './dmmf-types'
import { externalToInternalDmmf } from './externalToInternalDmmf'
import { transformDmmf } from './transformDmmf'

export function getPhotonDMMF(dmmf: DMMF.Document): PhotonDMMF.Document {
  return transformDmmf(externalToInternalDmmf(dmmf))
}

// Mostly used for tests
export async function getDMMF(
  options: GetDMMFOptions,
): Promise<PhotonDMMF.Document> {
  const dmmf = await getRawDMMF(options)
  return getPhotonDMMF(dmmf)
}
