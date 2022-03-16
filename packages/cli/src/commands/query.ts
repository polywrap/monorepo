import {
  fixParameters,
  getTestEnvClientConfig,
  importTypescriptModule,
  intlMsg,
  resolveQueryFiles,
  validateClientConfig,
} from "../lib";

import {
  Cookbook,
  Web3ApiClient,
  Web3ApiClientConfig,
} from "@web3api/client-js";
import {
  QueryApiOptions,
  QueryApiResult,
  getParserForFile,
} from "@web3api/core-js";
import chalk from "chalk";
import { GluegunToolbox } from "gluegun";
import path from "path";

const i18n = {
  apiMissing: intlMsg.commands_query_error_noApi(),
  args: intlMsg.commands_query_arguments_recipes(),
  badConstantsRead: intlMsg.commands_query_error_badConstantsRead,
  badQueryRead: intlMsg.commands_query_error_badQueryRead,
  clientConfigBadFileExt:
    intlMsg.commands_query_error_clientConfigInvalidFileExt,
  clientConfigMissingExport:
    intlMsg.commands_query_error_clientConfigModuleMissingExport,
  clientConfigMissingPath: intlMsg.commands_query_error_clientConfigMissingPath,
  config: intlMsg.commands_query_options_config(),
  configPath: intlMsg.commands_query_options_configPath(),
  description: intlMsg.commands_query_description(),
  menuNameCollision: intlMsg.commands_query_error_menuNameCollision,
  missingCookbookFile: intlMsg.commands_query_error_missingScript(),
  queryArg: intlMsg.commands_query_options_query(),
  queryArgDesc: intlMsg.commands_query_options_description_query(),
  noTestEnvFound: intlMsg.commands_query_error_noTestEnvFound(),
  options: intlMsg.commands_build_options_options(),
  testEns: intlMsg.commands_build_options_t(),
};

const HELP = `
${chalk.bold("w3 query")} [${i18n.options}] ${chalk.bold(`<${i18n.args}>`)}

${i18n.options[0].toUpperCase() + i18n.options.slice(1)}:
  -q, --query <${i18n.queryArg}>   ${i18n.queryArgDesc}
  -t, --test-ens  ${i18n.testEns}
  -c, --client-config <${i18n.configPath}>   ${i18n.config}
`;

export default {
  alias: ["q"],
  description: i18n.description,
  run: async (toolbox: GluegunToolbox): Promise<void> => {
    const { filesystem: fs, parameters, print } = toolbox;
    // eslint-disable-next-line prefer-const
    let { t, testEns, c, clientConfig, q, query } = parameters.options;

    testEns ||= t;
    clientConfig ||= c;
    query = (query || q || "").split(",");

    let inputFile: string;
    try {
      [inputFile] = fixParameters(
        {
          options: toolbox.parameters.options,
          array: toolbox.parameters.array,
        },
        {
          t,
          testEns,
        }
      );
    } catch (e) {
      print.error(e.message);
      process.exitCode = 1;
      return;
    }

    if (!inputFile) {
      print.error(i18n.missingCookbookFile);
      print.info(HELP);
      return;
    }

    if (clientConfig === true) {
      print.error(
        i18n.clientConfigMissingPath({
          option: "--client-config",
          argument: `<${i18n.configPath}>`,
        })
      );
      print.info(HELP);
      return;
    }

    let finalClientConfig: Partial<Web3ApiClientConfig>;
    try {
      finalClientConfig = await getTestEnvClientConfig();
    } catch (e) {
      print.error(i18n.noTestEnvFound);
      process.exitCode = 1;
      return;
    }
    if (clientConfig) {
      let configModule;
      if (clientConfig.endsWith(".js")) {
        configModule = await import(fs.resolve(clientConfig));
      } else if (clientConfig.endsWith(".ts")) {
        configModule = await importTypescriptModule(fs.resolve(clientConfig));
      } else {
        print.error(i18n.clientConfigBadFileExt({ module: clientConfig }));
        process.exitCode = 1;
        return;
      }
      if (!configModule || !configModule.getClientConfig) {
        print.error(i18n.clientConfigMissingExport({ module: configModule }));
        process.exitCode = 1;
        return;
      }

      finalClientConfig = configModule.getClientConfig(finalClientConfig);
      try {
        validateClientConfig(finalClientConfig);
      } catch (e) {
        print.error(e.message);
        process.exitCode = 1;
        return;
      }
    }

    const client = new Web3ApiClient(finalClientConfig);

    function onExecution<
      E extends Error,
      TData extends Record<string, unknown> = Record<string, unknown>
    >(
      recipe: QueryApiOptions,
      data?: QueryApiResult<TData>["data"],
      errors?: E[]
    ): void {
      print.warning("-----------------------------------");
      print.fancy(recipe.query.toString());
      print.fancy(JSON.stringify(recipe.variables, null, 2));
      print.warning("-----------------------------------");

      if (!!data && data !== {}) {
        print.success("-----------------------------------");
        print.fancy(JSON.stringify(data, null, 2));
        print.success("-----------------------------------");
      }
      for (const error of errors || []) {
        print.error("-----------------------------------");
        print.fancy(error.message);
        print.fancy(error.stack || "");
        print.error("-----------------------------------");
      }
    }

    let cookbookParser;
    try {
      cookbookParser = getParserForFile<Cookbook>(inputFile);
    } catch {
      // do nothing (intentionally)
    }

    if (cookbookParser) {
      const cookbook = cookbookParser(fs.read(inputFile) as string);
      if (cookbook == null || !("recipes" in cookbook)) {
        print.error("bad cookbook");
        process.exitCode = 1;
        return;
      }

      const dir = path.dirname(inputFile);

      if (!!cookbook.constants && typeof cookbook.constants === "string") {
        try {
          cookbook.constants =
            getParserForFile<Record<string, string>>(cookbook.constants)(
              fs.read(path.join(dir, cookbook.constants)) as string
            ) ?? undefined;
        } catch (e) {
          if (e instanceof URIError)
            throw new URIError(i18n.badConstantsRead({ file: e.message }));
          else throw e;
        }
      }

      try {
        resolveQueryFiles(cookbook.recipes, dir, fs);
      } catch (e) {
        if (e instanceof URIError)
          throw new URIError(i18n.badQueryRead({ query: e.message }));
        else throw e;
      }

      await client.cookRecipesSync({ cookbook, onExecution, query });
    } else
      await client.cookRecipesSync({
        onExecution,
        query,
        wrapperUri: inputFile,
      });
  },
};
