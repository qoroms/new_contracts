const {
  XANA_ADDRESS_REGISTRY,
  WRAPPED_ETH_MAINNET,
  WRAPPED_ETH_TESTNET
} = require('./constants');

async function main() {
  const Contract = await ethers.getContractFactory('XanaPriceFeed');
  const contract = await Contract.deploy(
    XANA_ADDRESS_REGISTRY,
    WRAPPED_ETH_MAINNET
  );

  await contract.deployed();

  console.log('XanaPriceFeed deployed to', contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
