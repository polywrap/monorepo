/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
import { DeployModule } from "../../../deploy";
import { invokeWithTimeout } from "./invokeWithTimeout";

import { Wallet } from "@ethersproject/wallet";
import { JsonRpcProvider } from "@ethersproject/providers";
import { IWrapPackage, Uri } from "@polywrap/core-js";
import {
  PolywrapClient,
  PolywrapClientConfigBuilder,
} from "@polywrap/client-js";
import { Web3 } from "@polywrap/client-config-builder-js";
import {
  Connection,
  Connections,
  ethereumProviderPlugin,
} from "@polywrap/ethereum-provider-js-v1";

const contentHash = require("content-hash");

class ENSPublisher implements DeployModule {
  async execute(
    uri: Uri,
    config: {
      domainName: string;
      provider: string;
      privateKey?: string;
      ensRegistryAddress: string;
    }
  ): Promise<Uri> {
    if (uri.authority !== "ipfs") {
      throw new Error(
        `ENS Deployer: resolved URI from ${uri} does not represent an IPFS contentHash`
      );
    }

    const cid = uri.path;

    const connectionProvider = new JsonRpcProvider(config.provider);
    const {
      chainId: chainIdNum,
      name: networkName,
    } = await connectionProvider.getNetwork();

    const network = chainIdNum === 1337 ? "testnet" : networkName;

    const signer = config.privateKey
      ? new Wallet(config.privateKey).connect(connectionProvider)
      : undefined;

    // Default connections
    const connections = new Connections({
      networks: {
        [network]: new Connection({
          provider: config.provider,
          signer,
        }),
      },
      defaultNetwork: network,
    });

    const clientConfig = new PolywrapClientConfigBuilder()
      .addDefaults()
      .setPackage(
        Web3.bundle.ethereumProviderV1.uri,
        ethereumProviderPlugin({
          connections: connections,
        }) as IWrapPackage
      )
      .build();

    const client = new PolywrapClient(clientConfig);

    const resolver = await client.invoke<string>({
      method: "getResolver",
      uri: "ens/wraps.eth:ens@1.0.0",
      args: {
        registryAddress: config.ensRegistryAddress,
        domain: config.domainName,
        connection: {
          networkNameOrChainId: network,
        },
      },
    });

    if (!resolver.ok) {
      throw new Error(
        `Could not get resolver for '${config.domainName}'. ${resolver.error}`
      );
    }

    if (resolver.value === "0x0000000000000000000000000000000000000000") {
      throw new Error(`Resolver not set for '${config.domainName}'`);
    }

    const hash = "0x" + contentHash.fromIpfs(cid);

    const setContenthashData = await client.invoke<{ hash: string }>({
      method: "setContentHash",
      uri: "ens/wraps.eth:ens@1.0.0",
      args: {
        domain: config.domainName,
        cid: hash,
        resolverAddress: resolver.value,
        connection: {
          networkNameOrChainId: network,
        },
      },
    });

    if (!setContenthashData.ok) {
      throw new Error(
        `Could not set contentHash for '${config.domainName}'. ${setContenthashData.error}`
      );
    }

    await invokeWithTimeout(
      client,
      {
        method: "awaitTransaction",
        uri: Uri.from("ens/wraps.eth:ethereum@1.0.0"),
        args: {
          txHash: setContenthashData.value.hash,
          connection: {
            networkNameOrChainId: network,
          },
        },
      },
      15000
    );

    return new Uri(`ens/${network}/${config.domainName}`);
  }
}

export default new ENSPublisher();
