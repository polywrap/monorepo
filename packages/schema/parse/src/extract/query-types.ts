import {
  TypeInfo,
  createQueryDefinition,
  createMethodDefinition,
} from "../typeInfo";
import {
  extractInputValueDefinition,
  extractListType,
  extractNamedType,
  State,
} from "./query-utils";

import {
  DocumentNode,
  ObjectTypeDefinitionNode,
  NonNullTypeNode,
  NamedTypeNode,
  ListTypeNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  visit,
} from "graphql";

const visitorEnter = (typeInfo: TypeInfo, state: State) => ({
  ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
    const nodeName = node.name.value;

    if (nodeName !== "Query" && nodeName !== "Mutation") {
      return;
    }

    const query = createQueryDefinition(nodeName, nodeName);
    typeInfo.queryTypes.push(query);
    state.currentQuery = query;
  },
  FieldDefinition: (node: FieldDefinitionNode) => {
    const query = state.currentQuery;

    if (!query) {
      return;
    }

    const operation = query.type === "Query" ? "query" : "mutation";
    const method = createMethodDefinition(operation, node.name.value);
    query.methods.push(method);
    state.currentMethod = method;
  },
  InputValueDefinition: (node: InputValueDefinitionNode) => {
    extractInputValueDefinition(node, state);
  },
  NonNullType: (_node: NonNullTypeNode) => {
    state.nonNullType = true;
  },
  NamedType: (node: NamedTypeNode) => {
    extractNamedType(node, state, typeInfo);
  },
  ListType: (_node: ListTypeNode) => {
    extractListType(state);
  },
});

const visitorLeave = (typeInfo: TypeInfo, state: State) => ({
  ObjectTypeDefinition: (_node: ObjectTypeDefinitionNode) => {
    state.currentQuery = undefined;
  },
  FieldDefinition: (_node: FieldDefinitionNode) => {
    state.currentMethod = undefined;
    state.currentReturn = undefined;
  },
  InputValueDefinition: (_node: InputValueDefinitionNode) => {
    state.currentArgument = undefined;
  },
  NonNullType: (_node: NonNullTypeNode) => {
    state.nonNullType = false;
  },
});

export function extractQueryTypes(
  astNode: DocumentNode,
  typeInfo: TypeInfo
): void {
  const state: State = {};

  visit(astNode, {
    enter: visitorEnter(typeInfo, state),
    leave: visitorLeave(typeInfo, state),
  });
}
