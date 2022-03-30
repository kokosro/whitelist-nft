const fs = require('fs');
const path = require('path');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const network = process.env.NETWORK || 'development';

let privateKeys = (process.env.DEPLOYER_PRIVATE_KEY || '').split(',').filter((x) => x.length > 0);

const providerUrl = process.env[`PROVIDER_URL_${network.toUpperCase()}`] || 'http://localhost:8545';

if (network === 'development' && privateKeys.length === 0) {
  if (fs.existsSync('./ganache-accounts')) {
    privateKeys = fs.readFileSync('./ganache-accounts', { encoding: 'utf8' }).split(',').map((k) => k.trim());
  }
}

if (privateKeys.length === 0) {
  console.log('DEPLOYER_PRIVATE_KEY must be provided in ENV');
  process.exit(1);
}

module.exports = {
  defaultNetwork: network,
  networks: {
    [network]: {
      url: providerUrl,
      accounts: privateKeys,
    },
  },
  solidity: {
    version: '0.8.3',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './tests',
    cache: './cache',
    artifacts: './artifacts',
    migrated: './migrated',
  },

  mocha: {
    timeout: 20000,
  },
  gasPrice: {
    maxGasPrice: 300000000000,
    maxPriorityFeePerGas: 2000000000,
  },
  etherscan: {
    apiKey: process.env[`ETHERSCAN_API_KEY_${network.toUpperCase()}`] || '_change_this_',
  },
};
