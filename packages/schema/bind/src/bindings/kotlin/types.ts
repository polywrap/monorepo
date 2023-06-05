/* eslint-disable @typescript-eslint/naming-convention */
const baseTypes = {
  Boolean: "Boolean",
  Byte: "Byte",
  Short: "Short",
  Int: "Int",
  Long: "Long",
  UByte: "UByte",
  UShort: "UShort",
  UInt: "UInt",
  ULong: "ULong",
  // Float: "Float",
  // Double: "Double",
  String: "String",
};

export type BaseTypes = typeof baseTypes;

export type BaseType = keyof BaseTypes;

export function isBaseType(type: string): type is BaseType {
  return type in baseTypes;
}

// source: https://kotlinlang.org/docs/keyword-reference.html
const keywords = {
  as: "as",
  "as?": "as?",
  break: "break",
  class: "class",
  continue: "continue",
  do: "do",
  else: "else",
  false: "false",
  for: "for",
  fun: "fun",
  if: "if",
  in: "in",
  "!in": "!in",
  interface: "interface",
  is: "is",
  "!is": "!is",
  null: "null",
  object: "object",
  package: "package",
  return: "return",
  super: "super",
  this: "this",
  throw: "throw",
  true: "true",
  try: "try",
  typealias: "typealias",
  typeof: "typeof",
  val: "val",
  var: "var",
  when: "when",
  while: "while",
};

const softKeywords = {
  by: "by",
  catch: "catch",
  constructor: "constructor",
  delegate: "delegate",
  dynamic: "dynamic",
  field: "field",
  file: "file",
  finally: "finally",
  get: "get",
  import: "import",
  init: "init",
  param: "param",
  property: "property",
  receiver: "receiver",
  set: "set",
  setparam: "setparam",
  value: "value",
  where: "where",
};

export type Keywords = typeof keywords;
export type Keyword = keyof Keywords;

export function isKeyword(keyword: string): keyword is Keyword {
  return keyword in keywords;
}

export type SoftKeywords = typeof softKeywords;
export type SoftKeyword = keyof SoftKeywords;

export function isSoftKeyword(keyword: string): keyword is SoftKeyword {
  return keyword in softKeywords;
}