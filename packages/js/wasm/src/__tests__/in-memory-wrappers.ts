import { buildWrapper } from "@polywrap/test-env-js";
import { GetPathToTestWrappers } from "@polywrap/test-cases";
import fs from "fs";
import { WasmPackage } from "../WasmPackage";
import { InMemoryFileReader } from "../InMemoryFileReader";
import { deserializeWrapManifest } from "@polywrap/wrap-manifest-types-js";
import { WasmWrapper } from "../WasmWrapper";

jest.setTimeout(200000);

const simpleWrapperPath = `${GetPathToTestWrappers()}/wasm-as/simple`;

describe("In-memory wrappers", () => {
  beforeAll(async () => {
    await buildWrapper(simpleWrapperPath);
  });

  it("can create in-memory wrapper from buffers", async () => {
    const manifest = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.info`
    );
    const wrapManifest = await deserializeWrapManifest(manifest);
   
    const wasmModule = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.wasm`
    );
    const wrapper = await WasmWrapper.from(manifest, wasmModule);

    expect(wrapManifest).toEqual(await wrapper.getManifest());
    expect(manifest).toEqual(await wrapper.getFile({ path: "wrap.info" }));
    expect(wasmModule).toEqual(await wrapper.getFile({ path: "wrap.wasm" }));
  });

  it("can create in-memory packages from file reader", async () => {
    const manifest = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.info`
    );
    const wrapManifest = await deserializeWrapManifest(manifest);
    
    const wasmModule = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.wasm`
    );

    const fileReader = InMemoryFileReader.from(manifest, wasmModule);
    const wrapper = await WasmWrapper.from(fileReader);

    expect(wrapManifest).toEqual(await wrapper.getManifest());
    expect(manifest).toEqual(await wrapper.getFile({ path: "wrap.info" }));
    expect(wasmModule).toEqual(await wrapper.getFile({ path: "wrap.wasm" }));
  });

  it("can create in-memory packages from manifest and file reader", async () => {
    const manifest = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.info`
    );
    const wrapManifest = await deserializeWrapManifest(manifest);
   
    const wasmModule = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.wasm`
    );

    const fileReader = InMemoryFileReader.from(manifest, wasmModule);
    const wrapper = await WasmWrapper.from(manifest, fileReader);

    expect(wrapManifest).toEqual(await wrapper.getManifest());
    expect(manifest).toEqual(await wrapper.getFile({ path: "wrap.info" }));
    expect(wasmModule).toEqual(await wrapper.getFile({ path: "wrap.wasm" }));
  });

  it("can create in-memory packages from manifest, wasm module and file reader", async () => {
    const testEncoded = new TextEncoder().encode("test");

    const manifest = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.info`
    );
    const wrapManifest = await deserializeWrapManifest(manifest);
   
    const wasmModule = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.wasm`
    );

    const wrapper = await WasmWrapper.from(manifest, wasmModule, {
      readFile: async (path: string) => {
        if (path === "test.txt") {
          return testEncoded;
        } else {
          return undefined;
        }
      }
    });
    
    expect(wrapManifest).toEqual(await wrapper.getManifest());
    expect(manifest).toEqual(await wrapper.getFile({ path: "wrap.info" }));
    expect(wasmModule).toEqual(await wrapper.getFile({ path: "wrap.wasm" }));
    expect(testEncoded).toEqual(await wrapper.getFile({ path: "test.txt" }));
  });

  it("can create in-memory wrappers from buffers", async () => {
    const manifest = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.info`
    );
    const wrapManifest = await deserializeWrapManifest(manifest);

    const wasmModule = await fs.promises.readFile(
      `${simpleWrapperPath}/build/wrap.wasm`
    );
    const wasmPackage = WasmPackage.from(manifest, wasmModule);
    const wrapper = await wasmPackage.createWrapper();

    expect(wrapManifest).toEqual(await wrapper.getManifest());
    expect(manifest).toEqual(await wrapper.getFile({ path: "wrap.info" }));
    expect(wasmModule).toEqual(await wrapper.getFile({ path: "wrap.wasm" }));
  });
});