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

export class MsgArray {
  static toBuffer<T>(type: Array<T>, item_fn: (writer: Write, item: T) => void): ArrayBuffer {
    const sizerContext: Context = new Context("Serializing (sizing) base-type: Array");
    const sizer = new WriteSizer(sizerContext);
    sizer.writeArrayLength(type.length);
    const buffer = new ArrayBuffer(sizer.length);
    const encoderContext: Context = new Context("Serializing (encoding) base-type: Array");
    const encoder = new WriteEncoder(buffer, sizer, encoderContext);
    encoder.writeArray(type, item_fn);
    return buffer;
  }

  static fromBuffer<T>(buffer: ArrayBuffer, item_fn: (reader: Read) => T): Array<T> {
    const context: Context = new Context("Deserializing base-type Array");
    const reader = new ReadDecoder(buffer, context);
    return reader.readArray(item_fn);
  }
}
