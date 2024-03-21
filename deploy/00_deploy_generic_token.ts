import { run } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';

const migrate: DeployFunction = async ({ getNamedAccounts, deployments: { deploy }, config, network }) => {
  const { deployer } = await getNamedAccounts();
  if (!deployer) {
    console.error(
      '\n\nERROR!\n\nThe node you are deploying to does not have access to a private key to sign this transaction. Add a private key in this application and activate it on the node you deployed this Smart Contract Set IDE on. If a private key already exists in this application, ensure that it is activated on the node you deployed this Smart Contract Set IDE on.\n\n'
    );
    process.exit(1);
  }

  await deploy('GenericToken', {
    from: deployer,
    args: ['GenericToken', 'GT'],
    log: true,
  });
  let hasEtherScanInstance = false;
  try {
    await run('verify:get-etherscan-endpoint');
    hasEtherScanInstance = true;
  } catch (e) {
    // ignore
  }
  if (hasEtherScanInstance) {
    await run('sourcify');
    if (!config.verify?.etherscan?.apiKey) {
      console.error(
        `\n\nERROR!\n\nYou have not set your Etherscan API key in your hardhat.config.ts file. Set it and run\n\npnpm hardhat --network '${network.name}' etherscan-verify\n\n`
      );
    } else {
      await new Promise((resolve) => {
        setTimeout(resolve, 10 * 1000);
      }); // allow etherscan to catch up
      await run('etherscan-verify');
    }
  }

  return true;
};

export default migrate;

migrate.id = '00_deploy_GenericToken';
migrate.tags = ['GenericToken'];
