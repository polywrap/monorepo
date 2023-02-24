import { AbiMerger } from "./AbiMerger";
import { AbiTreeShaker } from "./AbiTreeShaker";;
import { AbiImportsLinker } from "./AbiImportsLinker";
import { ExternalSchemaFetcher, LocalSchemaFetcher, SchemaParser, Abi } from "@polywrap/abi-types";

export * from "./AbiImportsLinker"
export * from "./AbiMerger"
export * from "./AbiTreeShaker"
export * from "./AbiVisitor"

interface Args {
  schema: string
  parser: SchemaParser
  fetchers: {
    external: ExternalSchemaFetcher;
    local: LocalSchemaFetcher;
  }
}

export const parseAndLinkSchema = async ({ schema, parser, fetchers }: Args): Promise<Abi> => {
  const abi = await parser.parse(schema)
  const externalImportStatements = await parser.parseExternalImportStatements(schema)
  const localImportStatements = await parser.parseLocalImportStatements(schema)

  const merger = new AbiMerger()
  const shaker = new AbiTreeShaker()
  const linker = new AbiImportsLinker(parser, fetchers, merger, shaker)
  const linkedAbi = await linker.link(abi, {
    external: externalImportStatements,
    local: localImportStatements
  })

  return linkedAbi
}