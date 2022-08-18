/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-empty-function */

import { Project, AnyProjectManifest } from "./";

import { Uri, PolywrapClient } from "@polywrap/client-js";
import {
  composeSchema,
  ComposerOptions,
  SchemaFile,
} from "@polywrap/schema-compose";
import fs from "fs";
import path from "path";
import * as gluegun from "gluegun";
import YAML from "js-yaml";
import { deserializeWrapManifest } from "@polywrap/wrap-manifest-types-js";
import { PolywrapManifest } from "@polywrap/polywrap-manifest-types-js";
import { WrapAbi } from "@polywrap/schema-parse";

export interface SchemaComposerConfig {
  project: Project<AnyProjectManifest>;
  client: PolywrapClient;
}

export class SchemaComposer {
  private _client: PolywrapClient;
  private _abi: WrapAbi | undefined;

  constructor(private _config: SchemaComposerConfig) {
    this._client = this._config.client;
  }

  public async getComposedAbis(): Promise<WrapAbi> {
    if (this._abi) {
      return Promise.resolve(this._abi);
    }

    const { project } = this._config;

    const schemaNamedPath = await project.getSchemaNamedPath();
    const import_abis = await project.getImportAbis();

    const getSchemaFile = (schemaPath?: string): SchemaFile | undefined =>
      schemaPath
        ? {
            schema: fs.readFileSync(schemaPath, "utf-8"),
            absolutePath: schemaPath,
          }
        : undefined;

    const schemaFile = getSchemaFile(schemaNamedPath);
    if (!schemaFile) {
      throw Error(`Schema cannot be loaded at path: ${schemaNamedPath}`);
    }

    const options: ComposerOptions = {
      schema: schemaFile,
      resolvers: {
        external: (uri: string) => this._fetchExternalAbi(uri, import_abis),
        local: (path: string) => Promise.resolve(this._fetchLocalSchema(path)),
      },
    };

    this._abi = await composeSchema(options);
    return this._abi;
  }

  public reset(): void {
    this._abi = undefined;
  }

  private async _fetchExternalAbi(
    uri: string,
    import_abis?: PolywrapManifest["import_abis"]
  ): Promise<WrapAbi> {
    // Check to see if we have any import redirects that match
    if (import_abis) {
      for (const import_abi of import_abis) {
        const redirectUri = new Uri(import_abi.uri);
        const uriParsed = new Uri(uri);

        if (!Uri.equals(redirectUri, uriParsed)) {
          continue;
        }

        const abiPath = path.join(
          this._config.project.getManifestDir(),
          import_abi.abi
        );

        if (!fs.existsSync(abiPath)) {
          throw Error("TODO file not found");
        }

        if (abiPath.endsWith(".info")) {
          const manifest = fs.readFileSync(abiPath);
          return (await deserializeWrapManifest(manifest)).abi;
        } else if (abiPath.endsWith(".graphql")) {
          const schema = fs.readFileSync(abiPath, "utf-8");
          const options: ComposerOptions = {
            schema: {
              schema: schema,
              absolutePath: abiPath,
            },
            resolvers: {
              external: (uri: string) =>
                this._fetchExternalAbi(uri, import_abis),
              local: (path: string) =>
                Promise.resolve(this._fetchLocalSchema(path)),
            },
          };

          return await composeSchema(options);
        } else if (abiPath.endsWith(".json")) {
          const json = fs.readFileSync(abiPath, "utf-8");
          // TODO: need to validate structure of ABI object
          return JSON.parse(json);
        } else if (abiPath.endsWith(".yaml")) {
          const yaml = fs.readFileSync(abiPath, "utf-8");
          const result = YAML.safeLoad(yaml);
          if (!result) {
            throw Error("TODO invalid");
          }
          // TODO: need to validate structure of ABI object
          return result as WrapAbi;
        } else {
          throw Error("TODO intl type here");
        }
      }
    }

    try {
      const manifest = await this._client.getManifest(new Uri(uri));
      return manifest.abi;
    } catch (e) {
      gluegun.print.error(e);
      throw e;
    }
  }

  private _fetchLocalSchema(schemaPath: string) {
    return fs.readFileSync(
      path.isAbsolute(schemaPath)
        ? schemaPath
        : path.join(this._config.project.getManifestDir(), schemaPath),
      "utf-8"
    );
  }
}
