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

export class Int32 {
  static toBuffer(type: i32): ArrayBuffer {
    const sizerContext: Context = new Context("Serializing (sizing) base-type: Int32");
    const sizer = new WriteSizer(sizerContext);
    sizer.writeInt32(type);
    const buffer = new ArrayBuffer(sizer.length);
    const encoderContext: Context = new Context("Serializing (encoding) base-type: Int32");
    const encoder = new WriteEncoder(buffer, sizer, encoderContext);
    encoder.writeInt32(type);
    return buffer;
  }

  static fromBuffer(buffer: ArrayBuffer): i32 {
    const context: Context = new Context("Deserializing base-type Int32");
    const reader = new ReadDecoder(buffer, context);
    return reader.readInt32();
  }
}
