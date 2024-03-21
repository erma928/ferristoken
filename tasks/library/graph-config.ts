import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';
import slugify from 'slugify';

function sanitize(value: string, length = 35) {
  return slugify(value, {
    strict: true,
    remove: /[*+~.()'"!:@]/g,
    replacement: '-',
    lower: true,
  })
    .slice(0, length)
    .replace(/(^[0-9]*)/g, '')
    .replace(/(-$)/g, '')
    .replace(/(^-)/g, '');
}

task('graph:config', 'Generates a subgraph config based on the contracts in this set').setAction(
  async (input: Record<string, string>, { network }: HardhatRuntimeEnvironment) => {
    if (!existsSync(`./deployments/${network.name}`)) {
      throw new Error(`No deployment on network ${network.name} found`);
    }
    console.log(chalk.yellow(`Updating the subgraph config for this smart contract set on network ${network.name}`));

    const contracts = [
      ...readdirSync(`./deployments/${network.name}`)
        .filter((file) => file.endsWith('.json'))
        .filter((file) => !file.endsWith('.migrations.json'))
        .map((file) => {
          const contract = JSON.parse(readFileSync(`./deployments/${network.name}/${file}`, 'utf8'));
          if (contract.devdoc && contract.devdoc['custom:security-contact']) {
            contract.devdoc.securityContact = contract.devdoc['custom:security-contact'];
            delete contract.devdoc['custom:security-contact'];
          }
          return {
            ...contract,
            name: file.replace('.json', ''),
          };
        }),
    ];

    const subgraphConfig: {
      output: string;
      chain: string;
      datasources: { name: string; address: string; startBlock: number; module: string[] }[];
    } = JSON.parse(readFileSync(`./subgraph.config.template.json`, 'utf8'));

    const updatedDataSources: {
      [name: string]: { name: string; address: string; startBlock: number; module: string[] };
    } = {};

    for (const datasource of subgraphConfig.datasources) {
      updatedDataSources[datasource.name] = datasource;
    }

    for (const contract of contracts) {
      if (!updatedDataSources[contract.name]) {
        console.warn(
          chalk.red(
            `  - No datasource found for ${contract.name}, please add a line in subgraph.config.template.json with the name field set to the name of the contract artifact in the deployments folder.`
          )
        );
      } else {
        console.info(chalk.green(`  - Updating address and start block for ${contract.name}`));
        updatedDataSources[contract.name] = {
          ...updatedDataSources[contract.name],
          address: contract.address,
          startBlock: contract.receipt.blockNumber,
        };
      }
    }

    subgraphConfig.datasources = Object.values(updatedDataSources);
    subgraphConfig.chain = sanitize(network.name, 30);

    writeFileSync('./subgraph.config.json', JSON.stringify(subgraphConfig, null, 2));

    console.log(chalk.green.bold(`Done generating subgraph for this smart contract set on network ${network.name}.`));
  }
);
