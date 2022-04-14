// to deploy locally
// run: npx hardhat node on a terminal
// then run: npx hardhat run --network localhost scripts/12_deploy_all.js
async function main(network) {

    console.log('network: ', network.name);

    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log(`Deployer's address: `, deployerAddress);
  
    const { TREASURY_ADDRESS, PLATFORM_FEE, WRAPPED_ETH_MAINNET, WRAPPED_ETH_TESTNET } = require('../constants');
  
    ////////////
    const Xana = await ethers.getContractFactory('Xana');
    const xana = await Xana.deploy(TREASURY_ADDRESS, '2000000000000000000');
  
    await xana.deployed();  
    console.log('Xana deployed at', xana.address);
    ///////////

    const RewardToken = await ethers.getContractFactory('RWToken');
    const rewardToken = await RewardToken.deploy();
  
    await rewardToken.deployed();  
    console.log('RewardToken deployed at', rewardToken.address);
    const REWARD_TOKEN_ADDR = rewardToken.address;

    const ZoraToken = await ethers.getContractFactory('ZoraToken');
    const zoraToken = await ZoraToken.deploy();
  
    await zoraToken.deployed();  
    console.log('ZoraToken deployed at', zoraToken.address);
    const ZORA_TOKEN_ADDR = zoraToken.address;

    ////////
    const AddressRegistry = await ethers.getContractFactory('XanaAddressRegistry');
    const addressRegistry = await AddressRegistry.deploy();

    await addressRegistry.deployed();

    console.log('XanaAddressRegistry deployed to', addressRegistry.address);
    const XANA_ADDRESS_REGISTRY = addressRegistry.address;
    ////////

    //////////
    const ProxyAdmin = await ethers.getContractFactory('ProxyAdmin');
    const proxyAdmin = await ProxyAdmin.deploy();
    await proxyAdmin.deployed();

    const PROXY_ADDRESS = proxyAdmin.address;

    console.log('ProxyAdmin deployed to:', proxyAdmin.address);

    const AdminUpgradeabilityProxyFactory = await ethers.getContractFactory('AdminUpgradeabilityProxy');
    //////////

    /////////
    const Marketplace = await ethers.getContractFactory('XanaMarketplace');
    const marketplaceImpl = await Marketplace.deploy();
    await marketplaceImpl.deployed();

    console.log('XanaMarketplace deployed to:', marketplaceImpl.address);
    
    const marketplaceProxy = await AdminUpgradeabilityProxyFactory.deploy(
        marketplaceImpl.address,
        PROXY_ADDRESS,
        []
    );
    await marketplaceProxy.deployed();
    console.log('Marketplace Proxy deployed at ', marketplaceProxy.address);
    const MARKETPLACE_PROXY_ADDRESS = marketplaceProxy.address;
    const marketplace = await ethers.getContractAt('XanaMarketplace', marketplaceProxy.address);
    
    await marketplace.initialize(TREASURY_ADDRESS, PLATFORM_FEE, REWARD_TOKEN_ADDR, TREASURY_ADDRESS, XANA_ADDRESS_REGISTRY, ZORA_TOKEN_ADDR);
    console.log('Marketplace Proxy initialized');
    
    /////////

    /////////
    const BundleMarketplace = await ethers.getContractFactory(
        'XanaBundleMarketplace'
      );
    const bundleMarketplaceImpl = await BundleMarketplace.deploy();
    await bundleMarketplaceImpl.deployed();
    console.log('XanaBundleMarketplace deployed to:', bundleMarketplaceImpl.address);
    
    const bundleMarketplaceProxy = await AdminUpgradeabilityProxyFactory.deploy(
        bundleMarketplaceImpl.address,
        PROXY_ADDRESS,
        []
      );
    await bundleMarketplaceProxy.deployed();
    console.log('Bundle Marketplace Proxy deployed at ', bundleMarketplaceProxy.address);  
    const BUNDLE_MARKETPLACE_PROXY_ADDRESS = bundleMarketplaceProxy.address;
    const bundleMarketplace = await ethers.getContractAt('XanaBundleMarketplace', bundleMarketplaceProxy.address);
    
    await bundleMarketplace.initialize(TREASURY_ADDRESS, PLATFORM_FEE, REWARD_TOKEN_ADDR, TREASURY_ADDRESS, XANA_ADDRESS_REGISTRY, ZORA_TOKEN_ADDR);
    console.log('Bundle Marketplace Proxy initialized');
    
    ////////

    ////////
    const Auction = await ethers.getContractFactory('XanaAuction');
    const auctionImpl = await Auction.deploy();
    await auctionImpl.deployed();
    console.log('XanaAuction deployed to:', auctionImpl.address);

    const auctionProxy = await AdminUpgradeabilityProxyFactory.deploy(
        auctionImpl.address,
        PROXY_ADDRESS,
        []
      );

    await auctionProxy.deployed();
    console.log('Auction Proxy deployed at ', auctionProxy.address);
    const AUCTION_PROXY_ADDRESS = auctionProxy.address;
    const auction = await ethers.getContractAt('XanaAuction', auctionProxy.address);
    
    await auction.initialize(TREASURY_ADDRESS, REWARD_TOKEN_ADDR, TREASURY_ADDRESS, XANA_ADDRESS_REGISTRY, ZORA_TOKEN_ADDR);
    console.log('Auction Proxy initialized');
   
    ////////

    ////////
    const Factory = await ethers.getContractFactory('XanaNFTFactory');
    const factory = await Factory.deploy(
        AUCTION_PROXY_ADDRESS,
        MARKETPLACE_PROXY_ADDRESS,
        BUNDLE_MARKETPLACE_PROXY_ADDRESS,
        '1000000000000000',
        TREASURY_ADDRESS,
        '5000000000000000'
    );
    await factory.deployed();
    console.log('XanaNFTFactory deployed to:', factory.address);

    const PrivateFactory = await ethers.getContractFactory(
        'XanaNFTFactoryPrivate'
    );
    const privateFactory = await PrivateFactory.deploy(
        AUCTION_PROXY_ADDRESS,
        MARKETPLACE_PROXY_ADDRESS,
        BUNDLE_MARKETPLACE_PROXY_ADDRESS,
        '1000000000000000',
        TREASURY_ADDRESS,
        '5000000000000000'
    );
    await privateFactory.deployed();
    console.log('XanaNFTFactoryPrivate deployed to:', privateFactory.address);
    ////////    

    ////////
    const NFTTradable = await ethers.getContractFactory('XanaNFTTradable');
    const nft = await NFTTradable.deploy(
        'Xana',
        'ART',
        AUCTION_PROXY_ADDRESS,
        MARKETPLACE_PROXY_ADDRESS,
        BUNDLE_MARKETPLACE_PROXY_ADDRESS,
        '1000000000000000',
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
        AUCTION_PROXY_ADDRESS,
        MARKETPLACE_PROXY_ADDRESS,
        BUNDLE_MARKETPLACE_PROXY_ADDRESS,
        '1000000000000000',
        TREASURY_ADDRESS
    );
    await nftPrivate.deployed();
    console.log('XanaNFTTradablePrivate deployed to:', nftPrivate.address);
    ////////

    ////////
    const TokenRegistry = await ethers.getContractFactory('XanaTokenRegistry');
    const tokenRegistry = await TokenRegistry.deploy();

    await tokenRegistry.deployed();

    console.log('XanaTokenRegistry deployed to', tokenRegistry.address);
    ////////

    ////////
    const PriceFeed = await ethers.getContractFactory('XanaPriceFeed');
    const WRAPPED_ETH = network.name === 'mainnet' ? WRAPPED_ETH_MAINNET : WRAPPED_ETH_TESTNET;
    const priceFeed = await PriceFeed.deploy(
      XANA_ADDRESS_REGISTRY,
      WRAPPED_ETH
    );
  
    await priceFeed.deployed();
  
    console.log('XanaPriceFeed deployed to', priceFeed.address);
    ////////

    ////////
    const ArtTradable = await ethers.getContractFactory('XanaArtTradable');
    const artTradable = await ArtTradable.deploy(
        'XanaArt',
        'FART',
        '2000000000000000',
        TREASURY_ADDRESS,
        MARKETPLACE_PROXY_ADDRESS,
        BUNDLE_MARKETPLACE_PROXY_ADDRESS
    );
    await artTradable.deployed();
    console.log('XanaArtTradable deployed to:', artTradable.address);

    const ArtTradablePrivate = await ethers.getContractFactory(
        'XanaArtTradablePrivate'
    );
    const artTradablePrivate = await ArtTradablePrivate.deploy(
        'XanaArt',
        'FART',
        '2000000000000000',
        TREASURY_ADDRESS,
        MARKETPLACE_PROXY_ADDRESS,
        BUNDLE_MARKETPLACE_PROXY_ADDRESS
    );
    await artTradablePrivate.deployed();
    console.log('XanaArtTradablePrivate deployed to:', artTradablePrivate.address);
    ////////

    ////////
    const ArtFactory = await ethers.getContractFactory('XanaArtFactory');
    const artFactory = await ArtFactory.deploy(
        MARKETPLACE_PROXY_ADDRESS,
        BUNDLE_MARKETPLACE_PROXY_ADDRESS,
        '2000000000000000',
        TREASURY_ADDRESS,
        '1000000000000000'
     );
    await artFactory.deployed();
    console.log('XanaArtFactory deployed to:', artFactory.address);

    const ArtFactoryPrivate = await ethers.getContractFactory(
        'XanaArtFactoryPrivate'
    );
    const artFactoryPrivate = await ArtFactoryPrivate.deploy(
        MARKETPLACE_PROXY_ADDRESS,
        BUNDLE_MARKETPLACE_PROXY_ADDRESS,
        '2000000000000000',
        TREASURY_ADDRESS,
        '1000000000000000'
    );
    await artFactoryPrivate.deployed();
    console.log('XanaArtFactoryPrivate deployed to:', artFactoryPrivate.address);
    ////////
    
    await marketplace.updateAddressRegistry(XANA_ADDRESS_REGISTRY);   
    await bundleMarketplace.updateAddressRegistry(XANA_ADDRESS_REGISTRY);
    
    await auction.updateAddressRegistry(XANA_ADDRESS_REGISTRY);
    
    await addressRegistry.updateXana(xana.address);
    await addressRegistry.updateAuction(auction.address);
    await addressRegistry.updateMarketplace(marketplace.address);
    await addressRegistry.updateBundleMarketplace(bundleMarketplace.address);
    await addressRegistry.updateNFTFactory(factory.address);
    await addressRegistry.updateTokenRegistry(tokenRegistry.address);
    await addressRegistry.updatePriceFeed(priceFeed.address);
    await addressRegistry.updateArtFactory(artFactory.address);   

    await tokenRegistry.add(WRAPPED_ETH);

  }
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main(network)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  

