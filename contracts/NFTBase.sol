// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./CanReceiveFunds.sol";

contract NFTBase is ERC721Enumerable, CanReceiveFunds, Ownable {
  using Counters for Counters.Counter;

  enum MintType { STANDARD, RESERVED };
  
  Counters.Counter private _standardTokenIds;
  Counters.Counter private _reservedTokenIds;
  uint256 private standardSupply;
  uint256 private reservedSupply;
  string private baseUri;
  uint256 public mintCost = 0.035 ether;
  
  address public dev;
  uint256 private maxPercentage = 10000;
  uint256 public devShare = 200;

  string private _contractUri;
  
  modifier onlyDev {
    require(msg.sender == dev, "ND");
    _;
  }
  
  constructor(string memory name_,
              string memory symbol_,
              string memory baseUri_,
              uint256 standardSupply_,
              uint256 reservedSupply_,
              uint256 mintCost_,
              address dev_)
    ERC721(name_, symbol_) {
    baseUri = baseUri_;
    standardSupply = standardSupply_;
    reservedSupply = reservedSupply_;
    dev = dev_;
    mintCost = mintCost_;
    
  }
  
  function setBaseUri(string memory baseUri_) external onlyOwner {
    baseUri = baseUri_;
  }
  
  function _baseURI() internal view override returns(string memory) {
     return baseUri;
  }

  function setContractUri(string memory uri) external onlyOwner {
    _contractUri = uri;
  }

  function contractURI() external view returns(string memory) {
    return _contractUri;
  }
  
  function setMintCost(uint256 amount_) external onlyOwner {  
    mintCost = amount_;
  }

  function setDev(address _dev) external onlyDev {
    dev = _dev;
  }
  function mintStandard(address tokenOwner) internal returns(uint256){
    if(_standardTokenIds.current() + 1 > standardSupply){
      return 0;
    }
    _standardTokenIds.increment();
    uint256 tokenId = _standardTokenIds.current();
    _mint(tokenOwner, tokenId);
    return tokenId;
  }

  function mintReserved(address tokenOwner) internal returns(uint256){
    if(_reservedTokenIds.current() + 1 > reservedSupply){
      return 0;
    }
    _reservedTokenIds.increment();
    uint256 tokenId = _reservedTokenIds.current() + standardSupply;
    _mint(tokenOwner, tokenId);
    return tokenId;
  }
  
  function totalSupply() external view returns(uint256){
    return _standardTokenIds.current() + _reservedTokenIds.current();
  }
  
  function mint(uint256 numberOfTokens) external payable returns(uint256[] memory){
    uint256[] memory generatedTokens = new uint256[](numberOfTokens);
    uint256 generatedCount = 0;
    for(uint256 i = 0; i < numberOfTokens; i++){
      generatedTokens[i] = mintStandard(msg.sender);
      if(generatedTokens[i] > 0){
        generatedCount += 1;
      }
    }

    uint256 requiredPayment = generatedCount * mintCost;

    require(msg.value >= requiredPayment, "Invalid payment");
    if(msg.value > requiredPayment){
      payable(msg.sender).transfer(msg.value - requiredPayment);
    }
    return generatedTokens;
  }
  
  function exists(uint256 tokenId) external view returns(bool) {
    
    return _exists(tokenId);
    
  }

  function adminMint(uint256 count, uint256 type, address tokenOwner) public onlyOwner returns(uint256[] memory) {
    uint256[] memory generatedTokens = new uint256[](count);
    if(type == uint256(MintType.STANDARD)){
      for(uint256 i = 0; i < count; i++){
        generatedTokens[i] = mintStandard(tokenOwner);
      }
    } else if(type == uint256(MintType.RESERVED)){
      for(uint256 i = 0; i < count; i++){
        generatedTokens[i] = mintReserved(tokenOwner);
      }
    }
    return generatedTokens;
  }

  function adminMint(uint256 count, uint256 type) external onlyOwner returns(uint256[] memory) {
    return adminMint(count, type, msg.sender);
  }

  function adminMint(uint256 count) external onlyOwner returns(uint256[] memory) {
    return adminMint(count, uint256(MintType.RESERVED), msg.sender);
  }

  function adminMint() external onlyOwner returns(uint256[] memory) {
    return adminMint(1, uint256(MintType.RESERVED), msg.sender);
  }
  
  function withdraw() external onlyOwner {
    
    uint256 available = address(this).balance;
    require(available > 0, "NB");

    uint256 devPayment = (available * devShare) / maxPercentage;
    
    payable(msg.sender).transfer(available - devPayment);
    
    if(devPayment > 0){
      payable(dev).transfer(devPayment);
    }
    
  }
  
}
