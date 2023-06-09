const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe('Escrow Contract', () => { 
    async function deployEscrowContract() {
        const [addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();

        const escrow = await ethers.getContractFactory('Escrow');
        const Escrow = await escrow.deploy(addr2.address, addr1.address, 50, addr3.address, [addr4.address], {value: (10*18).toString()});

        return {Escrow, addr1, addr2, addr3, addr4, addr5, addr6};
    }
    it('should not deploy contract, when `msg.value` not provided', async () => {
        const {addr1, addr2, addr3, addr4, addr5, addr6} = await loadFixture(deployEscrowContract);

        const escrow = await ethers.getContractFactory('Escrow');
        expect(escrow.deploy(addr2.address, addr1.address, 50, addr3.address, [addr4.address])).to.reverted;
    })
    it('should revert error when invalid thresold value `range > 0 && <=100`', async () => {
        const {addr1, addr2, addr3, addr4, addr5, addr6} = await loadFixture(deployEscrowContract);

        const escrow = await ethers.getContractFactory('Escrow');
        expect(escrow.deploy(addr2.address, addr1.address, 0, addr3.address, [addr4.address],{value: (10*18).toString()})).to.reverted;
        expect(escrow.deploy(addr2.address, addr1.address, 10, addr3.address, [addr4.address],{value: (10*18).toString()})).not.to.reverted;
        expect(escrow.deploy(addr2.address, addr1.address, 101, addr3.address, [addr4.address],{value: (10*18).toString()})).to.reverted;
    })
    it('contract should be in state of created when deployed', async () => {
        const {Escrow, addr6} = await loadFixture(deployEscrowContract);

        const currentStateOfContract = await Escrow.state();

        expect(Number(currentStateOfContract)).to.be.equal(0);
    })
    it(`voteCount should be zero when deployed`, async () => {
        const {Escrow} = await loadFixture(deployEscrowContract);

        const voteCount = await Escrow.voteCount();

        expect(Number(voteCount)).to.be.equal(0);
    })
})
