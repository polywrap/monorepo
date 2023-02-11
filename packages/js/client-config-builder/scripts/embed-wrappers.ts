import fs from "fs";
import path from "path";

async function main() {

  const wrappersDir = path.join(__dirname, "../src/bundles/wrappers");
  const wrappersDirents = fs.readdirSync(wrappersDir, { withFileTypes: true });

  const wrapperDirs: string[] = [];

  for (const dirent of wrappersDirents) {
    if (dirent.isDirectory()) {
      wrapperDirs.push(path.join(wrappersDir, dirent.name));
    }
  }

  for (const wrapperDir of wrapperDirs) {
    const wasmBytes = fs.readFileSync(
      path.join(wrapperDir, "wrap.wasm")
    );
    const infoBytes = fs.readFileSync(
      path.join(wrapperDir, "wrap.info")
    );

    fs.writeFileSync(
      path.join(wrapperDir, "wrap.ts"),
`// NOTE: This file is auto-generated, do not modify by hand!
// See: ./scripts/embed-wrappers.ts
import { WasmPackage } from "@polywrap/wasm-js";
import toUint8Array from "base64-to-uint8array";

const wrap_wasm = toUint8Array(
  "${wasmBytes.toString("base64")}"
);

const wrap_info = toUint8Array(
  "${infoBytes.toString("base64")}"
);

export const wasmPackage = WasmPackage.from(
  wrap_wasm,
  wrap_info
);
`
    );
  }
}

main()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.abort();
  });