const {
  TREASURY_ADDRESS,
  AUCTION,
  MARKETPLACE,
  BUNDLE_MARKETPLACE
} = require('./constants');

async function main() {
  const NFTTradable = await ethers.getContractFactory('XanaNFTTradable');
  const nft = await NFTTradable.deploy(
    'Xana',
    'ART',
    AUCTION,
    MARKETPLACE,
    BUNDLE_MARKETPLACE,
    '10000000000000000000',
    TREASURY_ADDRESS
  );
  await nft.deployed();
  console.log('XanaNFTTradable deployed to:', nft.address);

  const NFTTradablePrivate = await ethers.getContractFactory(
    'XanaNFTTradablePrivate'
  );
  const nftPrivate = await NFTTradablePrivate.deploy(
    'IXana',
    'IART',
    AUCTION,
    MARKETPLACE,
    BUNDLE_MARKETPLACE,
    '10000000000000000000',
    TREASURY_ADDRESS
  );
  await nftPrivate.deployed();
  console.log('XanaNFTTradablePrivate deployed to:', nftPrivate.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
