const hre = require("hardhat");

async function main() {
    const LnBcontract = await ethers.getContractFactory('Escrow');
    const buyer = '0xBD1331f9E06c2934cc9B9b3E6ad4F011e66869C1';
    const seller = '0x896388fe71D9e61ae564b315A3F5aBFf444aBb13';
    const arbitrtor = '0x896388fe71D9e61ae564b315A3F5aBFf444aBb13';
    const partner = '0x899f275e1ACa33a743b6B5C9F1E9f7D6b8a00B19';

    const value  = (10**9).toString();
    const lnb = await LnBcontract.deploy(buyer,seller,50,arbitrtor,[partner],{value: value})

    console.log('contract deploy to ', lnb.address);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });