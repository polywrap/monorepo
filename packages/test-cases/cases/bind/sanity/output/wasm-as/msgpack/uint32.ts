import {
  Read,
  ReadDecoder,
  Write,
  WriteSizer,
  WriteEncoder,
  Box,
  BigInt,
  BigNumber,
  JSON,
  Context
} from "@polywrap/wasm-as";

export class UInt32 {
  static toBuffer(type: u32): ArrayBuffer {
    const sizerContext: Context = new Context("Serializing (sizing) base-type: UInt32");
    const sizer = new WriteSizer(sizerContext);
    sizer.writeUInt32(type);
    const buffer = new ArrayBuffer(sizer.length);
    const encoderContext: Context = new Context("Serializing (encoding) base-type: UInt32");
    const encoder = new WriteEncoder(buffer, sizer, encoderContext);
    encoder.writeUInt32(type);
    return buffer;
  }

  static fromBuffer(buffer: ArrayBuffer): u32 {
    const context: Context = new Context("Deserializing base-type UInt32");
    const reader = new ReadDecoder(buffer, context);
    return reader.readUInt32();
  }
}
