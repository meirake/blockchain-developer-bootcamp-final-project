let TestNFTs = artifacts.require("TestNFTs");
let Escrow = artifacts.require("Escrow");

module.exports = async function(callback) { 
    const addr1 = '0x881Cb1f588E78AE94297fcb0f8ae6Edd80F864eA';

    let NFTs = await TestNFTs.deployed();
    const nftAddress = NFTs.address;
    let escrow = await Escrow.deployed();
    const escrowAddr = escrow.address;
    
    await NFTs.mintTestNFT({from: addr1});
    const id1 = await NFTs.getLastTokenID.call();
    console.log("addr1: " + id1.toNumber());

    await NFTs.approve(escrowAddr, id1, {from: addr1});
    console.log("Approved token for escrow.")
    console.log("NFT address: " + nftAddress);

    process.exit(0);
}