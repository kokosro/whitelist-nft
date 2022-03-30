const hre = require('hardhat');
const common = require('../common');
const migrationsConfig = require('../deployment.config.js');

async function main() {
  if (hre.config.etherscan && hre.config.etherscan.apiKey) {
    const contractDeploymentData = await common.savedContractData('ContractName');
    console.log('Verifying contracts');

    try {
      await hre.run('verify:verify', {
        address: contractDeploymentData.address,
        constructorArguments: [
          
        ],
        contract: 'contracts/ContractName.sol:ContractName',
      });
    } catch (e) {
      console.error(e);
      console.log(`error when verifying: ${e.message}`);
    }
  } else {
    console.log('ERROR, no Etherscan API provided in hardhat.config.js');
  }
}

main().then(() => {
  console.log('MIGRATIONS DONE');
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
