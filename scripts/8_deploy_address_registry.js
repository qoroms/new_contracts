async function main() {
  const Registry = await ethers.getContractFactory('XanaAddressRegistry');
  const contract = await Registry.deploy();

  await contract.deployed();

  console.log('XanaAddressRegistry deployed to', contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
