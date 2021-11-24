let TestNFTs = artifacts.require("TestNFTs");
let Escrow = artifacts.require("Escrow");

module.exports = async function(callback) { 
    const addr2 = '0xd85aEf433364c87DE9ba4910547B234B8448c045';

    let NFTs = await TestNFTs.deployed();
    const nftAddress = NFTs.address;
    let escrow = await Escrow.deployed();
    const escrowAddr = escrow.address;
    
    await NFTs.mintTestNFT({from: addr2});
    const id2 = await NFTs.getLastTokenID.call();
    console.log("NFT ID: " + id2.toNumber());
    console.log("NFT address: " + nftAddress);

    await NFTs.approve(escrowAddr, id2, {from: addr2});
    console.log("Approved token.")

    await escrow.deposit(nftAddress, id2, {from: addr2});
    console.log("deposited NFT for address 2.")

    process.exit(0);
}