/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/migrate-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/migrate-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */
import {
  AnyInfraManifest,
  InfraManifest,
  InfraManifestFormats,
} from ".";
import { findShortestMigrationPath } from "../../migrations";
import { migrators } from "./migrators";
import { ILogger } from "@polywrap/logging-js";

export function migrateInfraManifest(
  manifest: AnyInfraManifest,
  to: InfraManifestFormats,
  logger?: ILogger
): InfraManifest {
  let from = manifest.format as InfraManifestFormats;

  if (!(Object.values(InfraManifestFormats).some(x => x === from))) {
    throw new Error(`Unrecognized InfraManifestFormat "${manifest.format}"`);
  }

  if (!(Object.values(InfraManifestFormats).some(x => x === to))) {
    throw new Error(`Unrecognized InfraManifestFormat "${to}"`);
  }

  const migrationPath = findShortestMigrationPath(migrators, from, to);
  if (!migrationPath) {
    throw new Error(
      `Migration path from InfraManifestFormat "${from}" to "${to}" is not available`
    );
  }

  let newManifest = manifest;

  for(const migrator of migrationPath){
    newManifest = migrator.migrate(newManifest, logger) as AnyInfraManifest;
  }

  return newManifest as InfraManifest;
}
