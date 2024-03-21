
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-abi-exporter';
import 'hardhat-deploy';
import 'hardhat-log-remover';
import { HardhatUserConfig } from 'hardhat/config';
import { NetworksUserConfig } from 'hardhat/types';
import 'solidity-coverage';
import jsonConfig from './config.json';

type ipfsNodeType = Record<
 string,
   {
     headers: Record<string, string>;
     url: string;
     gateway: string;
  }
 >;

const { namedAccounts } = jsonConfig;
const networks = jsonConfig.networks as NetworksUserConfig;
const ipfsNodeConfig = jsonConfig.ipfsNodeConfig as ipfsNodeType;

// Workaround for older smart contract sets
const abiExporter: any = {
  path: './abi',
  runOnCompile: true,
  clear: true,
  flat: true,
  spacing: 2,
};

const config: HardhatUserConfig = {
  abiExporter,
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'istanbul',
    },
  },
  namedAccounts,
  networks,
};

export default config;

export const ipfsNodes: ipfsNodeType = ipfsNodeConfig;
