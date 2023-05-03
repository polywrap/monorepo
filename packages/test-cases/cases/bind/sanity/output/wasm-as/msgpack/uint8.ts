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

export class UInt8 {
  static toBuffer(type: u8): ArrayBuffer {
    const sizerContext: Context = new Context("Serializing (sizing) base-type: UInt8");
    const sizer = new WriteSizer(sizerContext);
    sizer.writeUInt8(type);
    const buffer = new ArrayBuffer(sizer.length);
    const encoderContext: Context = new Context("Serializing (encoding) base-type: UInt8");
    const encoder = new WriteEncoder(buffer, sizer, encoderContext);
    encoder.writeUInt8(type);
    return buffer;
  }

  static fromBuffer(buffer: ArrayBuffer): u8 {
    const context: Context = new Context("Deserializing base-type UInt8");
    const reader = new ReadDecoder(buffer, context);
    return reader.readUInt8();
  }
}
