// npx hardhat test .\test\HardhatOverAll.test.js --network localhost; run first in another shell: npx hardhat node
const {
    expectRevert,
    expectEvent,
    BN,
    ether,
    constants,
    balance,
    send
  } = require('@openzeppelin/test-helpers');
  
const {expect} = require('chai');

const XanaAddressRegistry = artifacts.require('XanaAddressRegistry');
const Xana = artifacts.require('Xana');
const XanaAuction = artifacts.require('MockXanaAuction');
const XanaMarketplace = artifacts.require('XanaMarketplace');
const XanaBundleMarketplace = artifacts.require('XanaBundleMarketplace');
const XanaNFTFactory = artifacts.require('XanaNFTFactory');
const XanaArtFactory = artifacts.require('XanaArtFactory');
const XanaTokenRegistry = artifacts.require('XanaTokenRegistry');
const XanaPriceFeed = artifacts.require('XanaPriceFeed');
const MockERC20 = artifacts.require('MockERC20');


const PLATFORM_FEE = '2';
const MARKETPLACE_PLATFORM_FEE = '50'  // 5%
const MINT_FEE = '1';

const weiToEther = (n) => {
    return web3.utils.fromWei(n.toString(), 'ether');
}


contract('Overall Test',  function ([owner, platformFeeRecipient, artist, buyer, bidder1, bidder2, bidder3])  {

    const platformFee = ether(PLATFORM_FEE);
    const marketPlatformFee = new BN(MARKETPLACE_PLATFORM_FEE);    
    const mintFee = ether(MINT_FEE);

    beforeEach(async function () {
        
        this.xanaAddressRegistry = await XanaAddressRegistry.new();
        this.xana = await Xana.new(platformFeeRecipient, platformFee);

        this.xanaAuction = await XanaAuction.new();
        await this.xanaAuction.initialize(platformFeeRecipient);
        await this.xanaAuction.updateAddressRegistry(this.xanaAddressRegistry.address);

        this.xanaMarketplace = await XanaMarketplace.new();
        await this.xanaMarketplace.initialize(platformFeeRecipient, marketPlatformFee);

        await this.xanaMarketplace.updateAddressRegistry(this.xanaAddressRegistry.address);

        this.xanaBundleMarketplace = await XanaBundleMarketplace.new();
        await this.xanaBundleMarketplace.initialize(platformFeeRecipient, marketPlatformFee);
        await this.xanaBundleMarketplace.updateAddressRegistry(this.xanaAddressRegistry.address);

        this.xanaNFTFactory = await XanaNFTFactory.new(this.xanaAuction.address, this.xanaMarketplace.address, this.xanaBundleMarketplace.address, mintFee, platformFeeRecipient, platformFee);
        this.xanaTokenRegistry = await XanaTokenRegistry.new();

        this.mockERC20 = await MockERC20.new("wETH", "wETH", ether('1000000'));

        this.xanaTokenRegistry.add(this.mockERC20.address);

        this.xanaPriceFeed = await XanaPriceFeed.new(this.xanaAddressRegistry.address, this.mockERC20.address);

        this.xanaArtFactory = await XanaArtFactory.new(this.xanaMarketplace.address, this.xanaBundleMarketplace.address, mintFee, platformFeeRecipient, platformFee);

        await this.xanaAddressRegistry.updateXana(this.xana.address);
        await this.xanaAddressRegistry.updateAuction(this.xanaAuction.address);
        await this.xanaAddressRegistry.updateMarketplace(this.xanaMarketplace.address);
        await this.xanaAddressRegistry.updateBundleMarketplace(this.xanaBundleMarketplace.address);
        await this.xanaAddressRegistry.updateNFTFactory(this.xanaNFTFactory.address);
        await this.xanaAddressRegistry.updateTokenRegistry(this.xanaTokenRegistry.address);
        await this.xanaAddressRegistry.updatePriceFeed(this.xanaPriceFeed.address);
        await this.xanaAddressRegistry.updateArtFactory(this.xanaArtFactory.address);
    });

    describe('Minting and auctioning NFT', function() {

        it('Scenario 1', async function(){

            console.log(`
            Scenario 1:
            An artist mints an NFT for him/herself
            He/She then put it on the marketplace with price of 20 wETHs
            A buyer then buys that NFT
            `);

            let balance = await this.xana.platformFee();
            console.log(`
            Platform Fee: ${weiToEther(balance)}`);

            let balance1 = await web3.eth.getBalance(artist);
            console.log(`
            ETH balance of artist before minting: ${weiToEther(balance1)}`);

            let balance2 = await web3.eth.getBalance(platformFeeRecipient);
            console.log(`
            ETH balance of the fee recipient before minting: ${weiToEther(balance2)}`);

            console.log(`
            Now minting...`);
            let result = await this.xana.mint(artist, 'http://artist.com/art.jpeg', {from: artist, value: ether(PLATFORM_FEE)});
            console.log(`
            Minted successfully`);

            let balance3 = await web3.eth.getBalance(artist);
            console.log(`
            ETH balance of artist after minting: ${weiToEther(balance3)}`);

            let balance4 = await web3.eth.getBalance(platformFeeRecipient);
            console.log(`
            ETH balance of recipient after minting: ${weiToEther(balance4)}`);

            console.log(`
            *The difference of the artist's ETH balance should be more than ${PLATFORM_FEE} ETH as 
            the platform fee is ${PLATFORM_FEE} ETH and minting costs some gases
            but should be less than ${PLATFORM_FEE + 1} ETH as the gas fees shouldn't be more than 1 ETH`);
            expect(weiToEther(balance1)*1 - weiToEther(balance3)*1).to.be.greaterThan(PLATFORM_FEE*1);
            expect(weiToEther(balance1)*1 - weiToEther(balance3)*1).to.be.lessThan(PLATFORM_FEE*1 + 1);

            console.log(`
            *The difference of the recipients's ETH balance should be ${PLATFORM_FEE} ETH as the platform fee is ${PLATFORM_FEE} ETH `);
            expect(weiToEther(balance4)*1 - weiToEther(balance2)*1).to.be.equal(PLATFORM_FEE*1);

            console.log(`
            *Event Minted should be emitted with correct values: 
            tokenId = 1, 
            beneficiary = ${artist}, 
            tokenUri = ${'http://artist.com/art.jpeg'},
            minter = ${artist}`);
            expectEvent.inLogs(result.logs, 'Minted',{
                tokenId: new BN('1'),
                beneficiary: artist,
                tokenUri : 'http://artist.com/art.jpeg',
                minter : artist
            });

            console.log(`
            The artist approves the nft to the market`);
            await this.xana.setApprovalForAll(this.xanaMarketplace.address, true, {from: artist});

            console.log(`
            The artist lists the nft in the market with price 20 wETH and 
            starting time 2021-09-22 10:00:00 GMT`);
            await this.xanaMarketplace.listItem(
                    this.xana.address,
                    new BN('1'),
                    new BN('1'),
                    this.mockERC20.address,
                    ether('20'),
                    new BN('1632304800'), // 2021-09-22 10:00:00 GMT
                    { from : artist }
                    );

            let listing = await this.xanaMarketplace.listings(this.xana.address, new BN('1'), artist);
            console.log(`
            *The nft should be on the marketplace listing`);
            expect(listing.quantity.toString()).to.be.equal('1');
            expect(listing.payToken).to.be.equal(this.mockERC20.address);
            expect(weiToEther(listing.pricePerItem)*1).to.be.equal(20);
            expect(listing.startingTime.toString()).to.be.equal('1632304800');

            console.log(`
            Mint 50 wETHs to buyer so he can buy the nft`);
            await this.mockERC20.mint(buyer, ether('50'));

            console.log(`
            Buyer approves XanaMarketplace to transfer up to 50 wETH`);
            await this.mockERC20.approve(this.xanaMarketplace.address, ether('50'), {from: buyer});
            
            console.log(`
            Buyer buys the nft for 20 wETHs`);
            result = await this.xanaMarketplace.buyItem(
                this.xana.address, 
                new BN('1'), 
                this.mockERC20.address, 
                artist, 
                { from: buyer});

            console.log(`
            *Event ItemSold should be emitted with correct values: 
            seller = ${artist}, 
            buyer = ${buyer}, 
            nft = ${this.xana.address},
            tokenId = 1,
            quantity =1,
            payToken = ${this.mockERC20.address},
            unitPrice = 20,
            pricePerItem = 20`);
            expectEvent.inLogs(result.logs, 'ItemSold',{
                seller: artist,
                buyer: buyer,
                nft : this.xana.address,
                tokenId : new BN('1'),
                quantity : new BN('1'),
                payToken : this.mockERC20.address,
                unitPrice : ether('0'),
                pricePerItem : ether('20')
            });


            balance = await this.mockERC20.balanceOf(buyer);
            console.log(`
            *The wETH balance of buyer now should be 30 wETHs`);
            expect(weiToEther(balance)*1).to.be.equal(30);

            let nftOwner = await this.xana.ownerOf(new BN('1'));
            console.log(`
            The owner of the nft now should be the buyer`);
            expect(nftOwner).to.be.equal(buyer);
            
            balance = await this.mockERC20.balanceOf(artist);
            console.log(`
            *The wETH balance of the artist should be 19 wETHs`);
            expect(weiToEther(balance)*1).to.be.equal(19);

            listing = await this.xanaMarketplace.listings(this.xana.address, new BN('1'), artist);
            console.log(`
            *The nft now should be removed from the listing`);            
            expect(listing.quantity.toString()).to.be.equal('0');
            expect(listing.payToken).to.be.equal(constants.ZERO_ADDRESS);
            expect(weiToEther(listing.pricePerItem)*1).to.be.equal(0);
            expect(listing.startingTime.toString()).to.be.equal('0');

            console.log('');
        });


        it('Scenario 2', async function() {

            console.log(`
            Scenario 2:
            An artist mints an NFT from him/herself
            He/She then put it on an auction with reserve price of 20 wETHs
            Bidder1, bidder2, bidder3 then bid the auction with 20 wETHs, 25 wETHs, and 30 wETHs respectively`);

            let balance = await this.xana.platformFee();
            console.log(`
            Platform Fee: ${weiToEther(balance)}`);

            let balance1 = await web3.eth.getBalance(artist);
            console.log(`
            ETH balance of artist before minting: ${weiToEther(balance1)}`);

            let balance2 = await web3.eth.getBalance(platformFeeRecipient);
            console.log(`
            ETH balance of the fee recipient before minting: ${weiToEther(balance2)}`);

            console.log(`
            Now minting...`);
            let result = await this.xana.mint(artist, 'http://artist.com/art.jpeg', {from: artist, value: ether(PLATFORM_FEE)});
            console.log(`
            Minted successfully`);

            let balance3 = await web3.eth.getBalance(artist);
            console.log(`
            ETH balance of artist after minting: ${weiToEther(balance3)}`);

            let balance4 = await web3.eth.getBalance(platformFeeRecipient);
            console.log(`
            ETH balance of recipient after minting: ${weiToEther(balance4)}`);

            console.log(`
            *The difference of the artist's ETH balance should be more than ${PLATFORM_FEE} ETHs as 
            the platform fee is ${PLATFORM_FEE} ETH and minting costs some gases
            but should be less than ${PLATFORM_FEE + 1} ETH as the gas fees shouldn't be more than 1 ETH`);
            expect(weiToEther(balance1)*1 - weiToEther(balance3)*1).to.be.greaterThan(PLATFORM_FEE*1);
            expect(weiToEther(balance1)*1 - weiToEther(balance3)*1).to.be.lessThan(PLATFORM_FEE*1 + 1);

            console.log(`
            *The difference of the recipients's ETH balance should be ${PLATFORM_FEE} ETHs as the platform fee is ${PLATFORM_FEE} ETHs `);
            expect(weiToEther(balance4)*1 - weiToEther(balance2)*1).to.be.equal(PLATFORM_FEE*1);

            console.log(`
            *Event Minted should be emitted with correct values: 
            tokenId = 1, 
            beneficiary = ${artist}, 
            tokenUri = ${'http://artist.com/art.jpeg'},
            minter = ${artist}`);
            expectEvent.inLogs(result.logs, 'Minted',{
                tokenId: new BN('1'),
                beneficiary: artist,
                tokenUri : 'http://artist.com/art.jpeg',
                minter : artist
            });

            console.log(`
            The artist approves the nft to the market`);
            await this.xana.setApprovalForAll(this.xanaAuction.address, true, {from: artist});

            console.log(`
            Let's mock that the current time: 2021-09-25 09:00:00`);
            await this.xanaAuction.setTime(new BN('1632560400'));

            console.log(`
            The artist auctions his nfts with reserve price of 20 wETHs`);
            result =  await this.xanaAuction.createAuction(
                this.xana.address,
                new BN('1'),
                this.mockERC20.address,
                ether('20'),
                new BN('1632564000'),  //2021-09-25 10:00:00
                false,
                new BN('1632996000'),   //2021-09-30 10:00:00
                { from: artist }
            );

            console.log(`
            *Event AuctionCreated should be emitted with correct values: 
            nftAddress = ${this.xana.address}, 
            tokenId = 1, 
            payToken = ${this.mockERC20.address}`);
            expectEvent.inLogs(result.logs, 'AuctionCreated',{
                nftAddress: this.xana.address,
                tokenId: new BN('1'),
                payToken: this.mockERC20.address
            });

            console.log(`
            Mint 50 wETHs to bidder1 so he can bid the auctioned nft`);
            await this.mockERC20.mint(bidder1, ether('50'));

            console.log(`
            Bidder1 approves XanaAuction to transfer up to 50 wETH`);
            await this.mockERC20.approve(this.xanaAuction.address, ether('50'), {from: bidder1});

            console.log(`
            Mint 50 wETHs to bidder2 so he can bid the auctioned nft`);
            await this.mockERC20.mint(bidder2, ether('50'));

            console.log(`
            Bidder2 approves XanaAuction to transfer up to 50 wETH`);
            await this.mockERC20.approve(this.xanaAuction.address, ether('50'), {from: bidder2});

            console.log(`
            Mint 50 wETHs to bidder3 so he can bid the auctioned nft`);
            await this.mockERC20.mint(bidder3, ether('50'));

            console.log(`
            Bidder3 approves XanaAuction to transfer up to 50 wETH`);
            await this.mockERC20.approve(this.xanaAuction.address, ether('50'), {from: bidder3});

            console.log(`
            Let's mock that the current time: 2021-09-25 10:30:00`);
            await this.xanaAuction.setTime(new BN('1632565800'));

            console.log(`
            Bidder1 place a bid of 20 wETHs`);
            await this.xanaAuction.placeBid(this.xana.address, new BN('1'), ether('20'), { from: bidder1 });

            balance = await this.mockERC20.balanceOf(bidder1);
            console.log(`
            *Bidder1's wETH balance after bidding should be 30 wETHs`);
            expect(weiToEther(balance)*1).to.be.equal(30);

            console.log(`
            Bidder2 place a bid of 25 wETHs`);
            await this.xanaAuction.placeBid(this.xana.address, new BN('1'), ether('25'), { from: bidder2 });

            balance = await this.mockERC20.balanceOf(bidder1);
            console.log(`
            *Bidder1's wETH balance after bidder2 outbid should be back to 50 wETHs`);
            expect(weiToEther(balance)*1).to.be.equal(50);

            balance = await this.mockERC20.balanceOf(bidder2);
            console.log(`
            *Bidder2's wETH balance after bidding should be 25`);
            expect(weiToEther(balance)*1).to.be.equal(25);            

            console.log(`
            Bidder3 place a bid of 30 wETHs`);
            await this.xanaAuction.placeBid(this.xana.address, new BN('1'), ether('30'), { from: bidder3 });

            balance = await this.mockERC20.balanceOf(bidder2);
            console.log(`
            *Bidder2's wETH balance after bidder3 outbid should be back to 50 wETHs`);
            expect(weiToEther(balance)*1).to.be.equal(50);

            balance = await this.mockERC20.balanceOf(bidder3);
            console.log(`
            *Bidder3's wETH balance after bidding should be 20`);
            expect(weiToEther(balance)*1).to.be.equal(20);

            console.log(`
            Let's mock that the current time: 2021-09-30 11:00:00 so the auction has ended`);
            await this.xanaAuction.setTime(new BN('1632999600'));

            console.log(`
            The artist tries to make the auction complete`);
            result = await this.xanaAuction.resultAuction(this.xana.address, new BN('1'), {from : artist});

            console.log(`
            *As the platformFee is 2.5%, the platform fee recipient should get 2.5% of (30 - 20) which is 0.25 wETH.`);
            balance = await this.mockERC20.balanceOf(platformFeeRecipient);
            expect(weiToEther(balance)*1).to.be.equal(0.25);

            console.log(`
            *The artist should get 29.75 wETH.`);
            balance = await this.mockERC20.balanceOf(artist);
            expect(weiToEther(balance)*1).to.be.equal(29.75);
            
            let nftOwner = await this.xana.ownerOf(new BN('1'));
            console.log(`
            *The owner of the nft now should be the bidder3`);
            expect(nftOwner).to.be.equal(bidder3);

            console.log(`
            *Event AuctionResulted should be emitted with correct values: 
            nftAddress = ${this.xana.address}, 
            tokenId = 1,
            winner = ${bidder3} ,
            payToken = ${this.mockERC20.address},
            unitPrice = 0,
            winningBid = 30`);
            expectEvent.inLogs(result.logs, 'AuctionResulted',{
                nftAddress: this.xana.address,
                tokenId: new BN('1'),
                winner: bidder3,
                payToken: this.mockERC20.address,
                unitPrice: ether('0'),
                winningBid: ether('30')
            });

        })


        it('Scenario 3', async function() {

            console.log(`
            Scenario 3:
            An artist mints two NFTs from him/herself
            He/She then put them on the marketplace as bundle price of 20 wETHs
            A buyer then buys them for 20 wETHs`);

            let balance = await this.xana.platformFee();
            console.log(`
            Platform Fee: ${weiToEther(balance)}`);

            let balance1 = await web3.eth.getBalance(artist);
            console.log(`
            ETH balance of artist before minting: ${weiToEther(balance1)}`);

            let balance2 = await web3.eth.getBalance(platformFeeRecipient);
            console.log(`
            ETH balance of the fee recipient before minting: ${weiToEther(balance2)}`);

            console.log(`
            Now minting the first NFT...`);
            let result = await this.xana.mint(artist, 'http://artist.com/art.jpeg', {from: artist, value: ether(PLATFORM_FEE)});
            console.log(`
            NFT1 minted successfully`);

            console.log(`
            *Event Minted should be emitted with correct values: 
            tokenId = 1, 
            beneficiary = ${artist}, 
            tokenUri = ${'http://artist.com/art.jpeg'},
            minter = ${artist}`);
            expectEvent.inLogs(result.logs, 'Minted',{
                tokenId: new BN('1'),
                beneficiary: artist,
                tokenUri : 'http://artist.com/art.jpeg',
                minter : artist
            });

            console.log(`
            Now minting the second NFT...`);
            result = await this.xana.mint(artist, 'http://artist.com/art2.jpeg', {from: artist, value: ether(PLATFORM_FEE)});
            console.log(`
            NFT2 minted successfully`);

            console.log(`
            *Event Minted should be emitted with correct values: 
            tokenId = 2, 
            beneficiary = ${artist}, 
            tokenUri = ${'http://artist.com/art2.jpeg'},
            minter = ${artist}`);
            expectEvent.inLogs(result.logs, 'Minted',{
                tokenId: new BN('2'),
                beneficiary: artist,
                tokenUri : 'http://artist.com/art2.jpeg',
                minter : artist
            });

            let balance3 = await web3.eth.getBalance(artist);
            console.log(`
            ETH balance of artist after minting: ${weiToEther(balance3)}`);

            let balance4 = await web3.eth.getBalance(platformFeeRecipient);
            console.log(`
            ETH balance of recipient after minting: ${weiToEther(balance4)}`);

            console.log(`
            *The difference of the artist's ETH balance should be more than ${2*PLATFORM_FEE} ETHs as 
            the platform fee is ${PLATFORM_FEE} ETH and minting costs some gases
            but should be less than ${PLATFORM_FEE + 1} ETH as the gas fees shouldn't be more than 1 ETH`);
            expect(weiToEther(balance1)*1 - weiToEther(balance3)*1).to.be.greaterThan(PLATFORM_FEE*2);
            expect(weiToEther(balance1)*1 - weiToEther(balance3)*1).to.be.lessThan(PLATFORM_FEE*2 + 1);

            console.log(`
            *The difference of the recipients's ETH balance should be ${PLATFORM_FEE*2} ETHs as the platform fee is ${PLATFORM_FEE} ETHs `);
            expect(weiToEther(balance4)*1 - weiToEther(balance2)*1).to.be.equal(PLATFORM_FEE*2);            

            console.log(`
            The artist approves the nft to the market`);
            await this.xana.setApprovalForAll(this.xanaBundleMarketplace.address, true, {from: artist});

            console.log(`
            The artist lists the 2 nfts in the bundle market with price 20 wETH and 
            starting time 2021-09-22 10:00:00 GMT`);
            await this.xanaBundleMarketplace.listItem(
                    'mynfts',
                    [this.xana.address, this.xana.address],
                    [new BN('1'),new BN('2')],
                    [new BN('1'), new BN('1')],
                    this.mockERC20.address,
                    ether('20'),
                    new BN('1632304800'), // 2021-09-22 10:00:00 GMT
                    { from : artist }
                    );

            let listing = await this.xanaBundleMarketplace.getListing(artist, 'mynfts');
            //console.log(listing);
            console.log(`
            *The nfts should be on the bundle marketplace listing`);
            expect(listing.nfts.length).to.be.equal(2);
            expect(listing.nfts[0]).to.be.equal(this.xana.address);
            expect(listing.nfts[1]).to.be.equal(this.xana.address);
            expect(listing.tokenIds[0].toString()).to.be.equal('1');
            expect(listing.tokenIds[1].toString()).to.be.equal('2');
            expect(listing.quantities[0].toString()).to.be.equal('1');
            expect(listing.quantities[1].toString()).to.be.equal('1');
            //expect(listing.payToken).to.be.equal(this.mockERC20.address);
            expect(weiToEther(listing.price)*1).to.be.equal(20);
            expect(listing.startingTime.toString()).to.be.equal('1632304800');

            console.log(`
            Mint 50 wETHs to buyer so he can buy the two nfts`);
            await this.mockERC20.mint(buyer, ether('50'));

            console.log(`
            The buyer approves XanaBundleMarketplace to transfer up to 50 wETH`);
            await this.mockERC20.approve(this.xanaBundleMarketplace.address, ether('50'), {from: buyer});

            console.log(`
            The buyer buys the nft for 20 wETHs`);
            result = await this.xanaBundleMarketplace.buyItem(
                'mynfts', 
                this.mockERC20.address, 
                { from: buyer});
                
            console.log(`
            *Event ItemSold should be emitted with correct values: 
            seller = ${artist}, 
            buyer = ${buyer}, 
            bundleId = ${'mynfts'},
            payToken = ${this.mockERC20.address},
            unitPrice = ${ether('0')},
            price = ${ether('20')}`);
            expectEvent.inLogs(result.logs, 'ItemSold',{
                seller: artist,
                buyer: buyer,
                bundleID : 'mynfts',
                payToken : this.mockERC20.address,
                unitPrice: ether('0'),
                price: ether('20')
                });
                
            console.log(`
            *The two nfts now should belong to buyer`);
            let nftOwner = await this.xana.ownerOf(new BN('1'));
            expect(nftOwner).to.be.equal(buyer);
            nftOwner = await this.xana.ownerOf(new BN('2'));
            expect(nftOwner).to.be.equal(buyer);

            console.log(`
            *The artist's wETH balance now should be 19 wTFM`);
            balance = await this.mockERC20.balanceOf(artist);
            expect(weiToEther(balance)*1).to.be.equal(19);

            console.log(`
            *The platform fee recipient's wETH balance now should be 1 wTFM`);
            balance = await this.mockERC20.balanceOf(platformFeeRecipient);
            expect(weiToEther(balance)*1).to.be.equal(1);

        })


       
    });
});