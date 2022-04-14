const {
  TREASURY_ADDRESS,
  MARKETPLACE,
  BUNDLE_MARKETPLACE
} = require('./constants');

async function main() {
  const ArtTradable = await ethers.getContractFactory('XanaArtTradable');
  const nft = await ArtTradable.deploy(
    'XanaArt',
    'FART',
    '20000000000000000000',
    TREASURY_ADDRESS,
    MARKETPLACE,
    BUNDLE_MARKETPLACE
  );
  await nft.deployed();
  console.log('XanaArtTradable deployed to:', nft.address);

  const ArtTradablePrivate = await ethers.getContractFactory(
    'XanaArtTradablePrivate'
  );
  const nftPrivate = await ArtTradablePrivate.deploy(
    'XanaArt',
    'FART',
    '20000000000000000000',
    TREASURY_ADDRESS,
    MARKETPLACE,
    BUNDLE_MARKETPLACE
  );
  await nftPrivate.deployed();
  console.log('XanaArtTradablePrivate deployed to:', nftPrivate.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
