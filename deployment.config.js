const { ethers } = require('ethers');

module.exports = {
  development: {
    name: 'ClimateCubes',
    symbol: 'ClimbateCubes',
    baseUri: 'http://localhost/token',
    contractUri: 'http://localhost/contract',
    standardSupply: 5355,
    reservedSupply: 200,
    mintCost: ethers.utils.parseUnits('0.03', 18),
  },
  ethereum: {
    name: 'ClimateCubes',
    symbol: 'ClimbateCubes',
    baseUri: '',
    contractUri: '',
    standardSupply: 5355,
    reservedSupply: 200,
    mintCost: ethers.utils.parseUnits('0.03', 18),
  },
  rinkeby: {
    name: 'ClimateCubes',
    symbol: 'ClimbateCubes',
    baseUri: '',
    contractUri: '',
    standardSupply: 5355,
    reservedSupply: 200,
    mintCost: ethers.utils.parseUnits('0.03', 18),
  },
};
