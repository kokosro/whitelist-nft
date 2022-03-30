const { ethers, waffle } = require('hardhat');
const chai = require('chai');
const common = require('../common');

chai.use(waffle.solidity); // used for testing emitted events

const { expect } = chai;

describe('AlwaysPassing', async () => {
  let admin;

  before(async () => {
    [admin] = await ethers.getSigners();
  });
  it('should be ok', async () => {
    expect(1).to.equal(1);
  });
});
