import { OutputDirectory, OutputEntry } from "../../";
import { loadDirectory } from "../../utils/fs";
import * as Functions from "./functions";

import { buildTypeInfo, TypeDefinition } from "@web3api/schema-parser";
import path from "path";

const Mustache = require("mustache");

export function generateBinding(schema: string): OutputDirectory {
  const entries: OutputEntry[] = [];
  const typeInfo = buildTypeInfo(schema, {
    extendProperties: (t: TypeDefinition): TypeDefinition => {
      return {
        ...t,
        ...Functions
      } as TypeDefinition;
    }
  });

  // Generate user type folders
  for (const userType of typeInfo.userTypes) {
    entries.push({
      type: "Directory",
      name: userType.name,
      data: generateFiles('./templates/user-type', userType)
    });
  }

  // Generate imported folder
  if (typeInfo.imports.length > 0) {
    const importEntries: OutputEntry[] = [];

    // Generate imported type folders
    for (const importedType of typeInfo.importedTypes) {
      importEntries.push({
        type: "Directory",
        name: importedType.name,
        data: generateFiles('./templates/imported/type', importedType)
      });
    }

    entries.push({
      type: "Directory",
      name: "imported",
      data: [
        ...importEntries,
        ...generateFiles('./templates/imported', typeInfo)
      ]
    });
  }

  // Generate query type folders
  for (const queryType of typeInfo.queryTypes) {
    entries.push({
      type: "Directory",
      name: queryType.name,
      data: generateFiles('./templates/query-type', queryType)
    });
  }

  // Generate root entry file
  entries.push(...generateFiles('./templates', typeInfo));

  return {
    entries
  };
}

function generateFiles(subpath: string, config: any, subDirectories: boolean = false): OutputEntry[] {
  const output: OutputEntry[] = [];
  const absolutePath = path.join(__dirname, subpath);
  const directory = loadDirectory(absolutePath);

  const processDirectory = (
    entries: OutputEntry[],
    output: OutputEntry[]
  ) => {
    // Load all sub-templates
    const subTemplates: any = { };

    for (const file of entries) {
      if (file.type !== "File") {
        continue;
      }

      const name = path.parse(file.name).name;

      // sub-templates contain '_' in their file names
      if (name.indexOf('_') > -1) {
        subTemplates[name] = file.data;
      }
    }

    // Generate all files, recurse all directories
    for (const dirent of entries) {
      if (dirent.type === "File") {
        const name = path.parse(dirent.name).name;

        // file templates don't contain '_'
        if (name.indexOf('_') === -1) {
          output.push({
            type: "File",
            name: name.replace('-', '.'),
            data: Mustache.render(dirent.data, config, subTemplates)
          });
        }
      } else if (dirent.type === "Directory" && subDirectories) {
        const subOutput: OutputEntry[] = [];

        processDirectory(dirent.data as OutputEntry[], subOutput);

        output.push({
          type: "Directory",
          name: dirent.name,
          data: subOutput
        });
      }
    }
  }

  processDirectory(directory.entries, output);

  return output;
}
