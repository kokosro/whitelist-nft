const hre = require('hardhat');
const common = require('../common');
const migrationsConfig = require('../deployment.config.js');

async function main() {
  console.log(`starting migrations on ${hre.network.name} network`);
  if (!migrationsConfig[hre.network.name]) {
    throw new Error(`Migrations config for network ${hre.network.name} are unavaiable`);
    process.exit(1);
  }
  console.log('compiling contracts');
  await hre.run('compile');
  console.log(`running migrations on ${hre.network.name} network`);

  const capitalStruggle = await common.deployer('ContractName', {
    args: [

    ],
  });
  let tx;
}

main().then(() => {
  console.log('MIGRATIONS DONE');
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
