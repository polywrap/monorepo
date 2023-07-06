import { BuildOverrides } from "../../../../build-strategies";
import { intlMsg } from "../../../../intl";

import { PolywrapManifest } from "@polywrap/polywrap-manifest-types-js";

export function getBuildOverrides(): BuildOverrides {
  return {
    validateManifest: (manifest: PolywrapManifest) => {
      const module = manifest.source.module;

      if (module && module.indexOf("Cargo.toml") === -1) {
        throw Error(intlMsg.lib_wasm_rust_invalidModule({ path: module }));
      }

      return Promise.resolve();
    }
  }
}
