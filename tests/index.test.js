const { ethers, waffle } = require('hardhat');
const chai = require('chai');
const { MerkleTree } = require('merkletreejs');
const common = require('../common');

chai.use(waffle.solidity); // used for testing emitted events

const { expect } = chai;

describe('NFT', async () => {
  let admin;
  let accounts;
  let NFTBase;
  let nft;
  const theMintCost = ethers.utils.parseUnits('0.035', 18);
  before(async () => {
    [admin, ...accounts] = await ethers.getSigners();
    NFTBase = await ethers.getContractFactory('NFTBase');
  });
  beforeEach(async () => {
    nft = await NFTBase.deploy('test', 'test', 'http://localhost/token/', 5355, 200, theMintCost);
  });
  it('should correctly be deployed', async () => {
    const [paused, whitelistActive, totalSupply, merkleRoot, mintCost] = await Promise.all([
      nft.paused(),
      nft.whitelistActive(),
      nft.totalSupply(),
      nft.merkleRoot(),
      nft.mintCost(),
    ]);
    expect(paused).to.equal(true);
    expect(whitelistActive).to.equal(false);
    expect(totalSupply).to.equal(0);
    expect(merkleRoot).to.equal(ethers.constants.HashZero);
    expect(mintCost).to.equal(theMintCost);
  });
  it('should correctly pause/unpause', async () => {
    let [paused] = await Promise.all([
      nft.paused(),
    ]);
    expect(paused).to.equal(true);
    await nft.setPauseStatus(false);
    [paused] = await Promise.all([
      nft.paused(),
    ]);
    expect(paused).to.equal(false);
  });
  it('should correctly set merkleRoot', async () => {
    const whitelistedAccounts = accounts.slice(0, 5);
    const leaves = whitelistedAccounts.map((account) => ethers.utils.keccak256(account.address));
    const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sort: true });
    const merkleRoot = tree.getHexRoot();
    await nft.setMerkleRoot(merkleRoot);
    const root = await nft.merkleRoot();
    expect(root).to.equal(merkleRoot);
  });
  it('should correctly activate/deactivate whihtelist period', async () => {
    let [whitelistActive] = await Promise.all([
      nft.whitelistActive(),
    ]);
    expect(whitelistActive).to.equal(false);
    await expect(nft.setWhitelistActive(true)).to.be.revertedWith('MerkleRoot must be set');

    const whitelistedAccounts = accounts.slice(0, 5);
    const leaves = whitelistedAccounts.map((account) => ethers.utils.keccak256(account.address));
    const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sort: true });
    const merkleRoot = tree.getHexRoot();
    await nft.setMerkleRoot(merkleRoot);
    const root = await nft.merkleRoot();
    expect(root).to.equal(merkleRoot);
    await nft.setWhitelistActive(true);
    [whitelistActive] = await Promise.all([
      nft.whitelistActive(),
    ]);
    expect(whitelistActive).to.equal(true);
    await nft.setWhitelistActive(false);
    [whitelistActive] = await Promise.all([
      nft.whitelistActive(),
    ]);
    expect(whitelistActive).to.equal(false);
  });
  it('should correctly mint standard and reserved tokens by admin', async () => {
    await nft['adminMint(uint256,uint256)'](2, 0);
    await nft['adminMint(uint256,uint256)'](2, 1);
    const expectedOwnedTokens = [1, 2, 5356, 5357];
    const balanceOfOwner = await nft.balanceOf(admin.address);
    expect(balanceOfOwner).to.equal(expectedOwnedTokens.length);
    const tokens = await Promise.all(Array(expectedOwnedTokens.length).fill('').map((_, idx) => nft.tokenOfOwnerByIndex(admin.address, idx)));
    expect(tokens.length).to.equal(expectedOwnedTokens.length);
    for (let i = 0; i < tokens.length; i++) {
      expect(tokens[i]).to.equal(expectedOwnedTokens[i]);
    }
  });
  it('should allow whitelist minting', async () => {
    let [paused] = await Promise.all([
      nft.paused(),
    ]);
    expect(paused).to.equal(true);
    await expect(nft.whitelistMint(1, [], { value: theMintCost })).to.be.revertedWith('Minting Is Paused');

    await nft.setPauseStatus(false);

    [paused] = await Promise.all([
      nft.paused(),
    ]);
    expect(paused).to.equal(false);
    await expect(nft.whitelistMint(1, [], { value: theMintCost })).to.be.revertedWith('Whitelist Period Not Active');

    const whitelistedAccounts = accounts.slice(0, 5);
    const leaves = whitelistedAccounts.map((account) => ethers.utils.keccak256(account.address));
    const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sort: true });
    const merkleRoot = tree.getHexRoot();
    await nft.setMerkleRoot(merkleRoot);
    const root = await nft.merkleRoot();
    expect(root).to.equal(merkleRoot);
    await nft.setWhitelistActive(true);
    const [whitelistActive] = await Promise.all([
      nft.whitelistActive(),
    ]);
    expect(whitelistActive).to.equal(true);

    await expect(nft.whitelistMint(1, [], { value: theMintCost })).to.be.revertedWith('Only Whitelisted Addresses');
    const proof = tree.getHexProof(ethers.utils.keccak256(whitelistedAccounts[0].address));
    await expect(nft.connect(whitelistedAccounts[0]).whitelistMint(1, proof, { value: ethers.utils.parseUnits('0.001', 18) })).to.be.revertedWith('Invalid payment');
    await expect(nft.connect(whitelistedAccounts[0]).whitelistMint(1, proof, { value: theMintCost })).to.not.be.reverted;
    const balanceOfAccount = await nft.balanceOf(whitelistedAccounts[0].address);
    expect(balanceOfAccount).to.equal(1);
    expect(await nft.tokenOfOwnerByIndex(whitelistedAccounts[0].address, 0)).to.equal(1);
  });

  it('should allow regular minting', async () => {
    let [paused] = await Promise.all([
      nft.paused(),
    ]);
    expect(paused).to.equal(true);
    await expect(nft.whitelistMint(1, [], { value: theMintCost })).to.be.revertedWith('Minting Is Paused');

    await nft.setPauseStatus(false);

    [paused] = await Promise.all([
      nft.paused(),
    ]);
    expect(paused).to.equal(false);

    const whitelistedAccounts = accounts.slice(0, 5);
    const leaves = whitelistedAccounts.map((account) => ethers.utils.keccak256(account.address));
    const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sort: true });
    const merkleRoot = tree.getHexRoot();
    await nft.setMerkleRoot(merkleRoot);
    const root = await nft.merkleRoot();
    expect(root).to.equal(merkleRoot);
    await nft.setWhitelistActive(true);
    const [whitelistActive] = await Promise.all([
      nft.whitelistActive(),
    ]);
    expect(whitelistActive).to.equal(true);
    await expect(nft.mint(1, { value: theMintCost })).to.be.revertedWith('Whitelist Period Is Active');
    await nft.setWhitelistActive(false);
    await expect(nft.connect(accounts[6]).mint(1, { value: theMintCost })).to.not.be.reverted;
    const balanceOfAccount = await nft.balanceOf(accounts[6].address);
    expect(balanceOfAccount).to.equal(1);
    expect(await nft.tokenOfOwnerByIndex(accounts[6].address, 0)).to.equal(1);
  });

  it('should have correct token uri and contract uri', async () => {
    await nft['adminMint(uint256,uint256)'](1, 0);
    const expectedTokenId = 1;
    const tokenUri = await nft.tokenURI(expectedTokenId);
    expect(tokenUri).to.equal(`http://localhost/token/${expectedTokenId}`);
    await nft.setContractUri('http://localhost/contract');
    const contractUri = await nft.contractURI();
    expect(contractUri).to.equal('http://localhost/contract');
  });

  it('should withdraw', async () => {
    await expect(nft.withdraw()).to.be.revertedWith('NB');
    await expect(nft.connect(accounts[1]).withdraw()).to.be.revertedWith('Ownable: caller is not the owner');

    await nft.setPauseStatus(false);

    await nft.connect(accounts[1]).mint(1, { value: theMintCost });
    const balanceOfOwnerBeforeWithdraw = await ethers.provider.getBalance(admin.address);
    const tx = await nft.withdraw();
    const receipt = await tx.wait();

    const balanceOfOwnerAfterWithdraw = await ethers.provider.getBalance(admin.address);
    expect(balanceOfOwnerAfterWithdraw).to.equal(balanceOfOwnerBeforeWithdraw.add(theMintCost).sub(tx.gasPrice.mul(receipt.gasUsed)));
  });
});
