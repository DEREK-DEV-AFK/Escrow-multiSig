const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('Escrow Contract', () => { 
    async function deployEscrowContract() {
        const [addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();

        const escrow = await ethers.getContractFactory('Escrow');
        const Escrow = await escrow.deploy(addr2.address, addr1.address, 50, addr3.address, [addr4.address], {value: (10**18).toString()});

        return {Escrow, addr1, addr2, addr3, addr4, addr5, addr6};
    }
    describe('deploy',() => {
        it('should revert error, when `msg.value` not provided while deploying and store balance of amount if provided', async () => {
            const {addr1, addr2, addr3, addr4, addr5, addr6} = await loadFixture(deployEscrowContract);
    
            const escrow = await ethers.getContractFactory('Escrow');
            expect(escrow.deploy(addr2.address, addr1.address, 50, addr3.address, [addr4.address])).to.reverted;

            const valueProvided = (10**18).toString();

            const Escrow = await escrow.deploy(addr2.address, addr1.address, 50, addr3.address, [addr4.address], {value: valueProvided});

            const value = await Escrow.value();

            expect(Number(value)).to.be.equal(Number(valueProvided));
        })
        it('should revert error when invalid thresold value `range > 0 && <=100`', async () => {
            const {addr1, addr2, addr3, addr4, addr5, addr6} = await loadFixture(deployEscrowContract);
    
            const escrow = await ethers.getContractFactory('Escrow');
            expect(escrow.deploy(addr2.address, addr1.address, 0, addr3.address, [addr4.address],{value: (10*18).toString()})).to.reverted;
            expect(escrow.deploy(addr2.address, addr1.address, 10, addr3.address, [addr4.address],{value: (10*18).toString()})).not.to.reverted;
            expect(escrow.deploy(addr2.address, addr1.address, 101, addr3.address, [addr4.address],{value: (10*18).toString()})).to.reverted;
        })
        it("should allow empty array, if user does'nt want to add partner", async () => {
            const {addr1, addr2, addr3, addr4, addr5, addr6} = await loadFixture(deployEscrowContract);
    
            const escrow = await ethers.getContractFactory('Escrow');

            expect(escrow.deploy(addr2.address, addr1.address, 100, addr3.address, [],{value: (10*18).toString()})).not.to.reverted;
        })
        it('contract should be in state of created when deployed', async () => {
            const {Escrow, addr6} = await loadFixture(deployEscrowContract);
    
            const currentStateOfContract = await Escrow.state();
    
            expect(Number(currentStateOfContract)).to.be.equal(0);
        })
        it(`fund release voteCount should be zero when deployed`, async () => {
            const {Escrow} = await loadFixture(deployEscrowContract);
    
            const voteCount = await Escrow.fundReleaseVoteCount();
    
            expect(Number(voteCount)).to.be.equal(0);
        })
    })
    describe('contract state:Created', () => {
        describe('Receive Eth', () => {
            describe('Validation',() => {
                it('should allow to receive more eth when state is created', async () => {
                    const {Escrow, addr6} = await loadFixture(deployEscrowContract);

                    const valueSended = (10**18).toString();

                    await addr6.sendTransaction({
                        to: Escrow.address,
                        value: valueSended
                    });
        
                    const valueInContract = await Escrow.value();
        
                    expect(Number(valueInContract)).to.be.greaterThan(Number(valueSended))
                })
                it('should not accept if contract state is not Created', async () => {
                    const {Escrow, addr6} = await loadFixture(deployEscrowContract);

                    await Escrow.initiateReleasePayment();

                    const valueSended = (10**18).toString();

                    expect(addr6.sendTransaction({
                        to: Escrow.address,
                        value: valueSended
                    })).to.be.revertedWith("Invalid escrow state.")
                })
            })
            describe('Event',() => {
                it('should emit event when received ETH', async () => {
                    const {Escrow, addr6} = await loadFixture(deployEscrowContract);

                    expect(addr6.sendTransaction({
                        to: Escrow.address,
                        value: ethers.utils.parseEther('1')
                    })).to.emit(Escrow,'Deposit');
                })
            })
        })
        describe('Add Partner', () => {
            describe('Validation', () => {
                it('should only allow seller aka owner to add partners', async () => {
                    const {Escrow, addr6} = await loadFixture(deployEscrowContract);

                    expect(await Escrow.addNewPartner(addr6.address)).not.to.be.reverted;
                })
                it('should not allow duplicate adddress to add again or address zero', async () => {
                    const {Escrow, addr4} = await loadFixture(deployEscrowContract);

                    expect(Escrow.addNewPartner(addr4.address)).to.be.revertedWith("is already an partner");
                    expect(Escrow.addNewPartner(ethers.constants.AddressZero)).to.be.revertedWith("invalid address");
                })
                it('should not allow to add partner when contract state is not created', async () => {
                    const {Escrow, addr4} = await loadFixture(deployEscrowContract);

                    await Escrow.initiateReleasePayment();

                    expect(Escrow.addNewPartner(addr4.address)).to.be.revertedWith("Invalid escrow state.");
                })
            })
            describe('Event', () => {
                it('should emit event when new partner gets added', async () => {
                    const {Escrow, addr5} = await loadFixture(deployEscrowContract);

                    expect(Escrow.addNewPartner(addr5.address)).to.emit(Escrow,'newPartner');
                })
            })
        })
        describe('initiate release payment', () => {
            describe('Validation', () => {
                it('should allow only seller or partner to initiate release payment', async () => {
                    const { Escrow, addr2, addr4 } = await loadFixture(deployEscrowContract);

                    expect(await Escrow.connect(addr4).initiateReleasePayment()).not.to.be.reverted;
                    expect(Escrow.connect(addr2).initiateReleasePayment()).to.be.reverted;
                })
                it('should initiateReleasePayment when contract is in created state',async () => {
                    const { Escrow } = await loadFixture(deployEscrowContract);

                    expect(await Escrow.initiateReleasePayment()).not.to.be.reverted;
                })
                it('should revert error if the contract is not in created state', async () => {
                    const { Escrow, addr2 } = await loadFixture(deployEscrowContract);

                    await Escrow.connect(addr2).initiateDispute();

                    expect(Escrow.initiateReleasePayment()).to.be.revertedWith('Invalid escrow state.')
                })
            })
            describe('Event', () => {
                it('should emit event when initiate release payment', async () => {
                    const {Escrow} = await loadFixture(deployEscrowContract);

                    expect(await Escrow.initiateReleasePayment()).to.emit(Escrow,'InitiateRelease')
                })
            })
        })
        describe('approveReleasePayment', () => {
            it('should revert error since contract is in created state', async () => {
                const { Escrow} = await loadFixture(deployEscrowContract);

                expect(Escrow.approveReleasePayment()).to.be.revertedWith('Invalid escrow state.');
            })
        })
        describe('disapproveReleasePayment', () => {
            it('should revert error since contract is in created state', async () => {
                const { Escrow} = await loadFixture(deployEscrowContract);

                expect(Escrow.disapproveReleasePayment()).to.be.revertedWith('Invalid escrow state.');
            })
        })
        describe('hasPassedThresold', () => {
            it('should return false since voting has not started yet', async () => {
                const { Escrow } = await loadFixture(deployEscrowContract);

                const hasPassthresold = await Escrow.hasPassedThresold();
                expect(hasPassthresold).to.be.false;

            })
        })
        describe('releasePayment', () => {
            it('should revert error since contract is in created state', async () => {
                const { Escrow} = await loadFixture(deployEscrowContract);

                expect(Escrow.releasePayment()).to.be.revertedWith('Invalid escrow state.');
            })
        })
        describe('refundPayment', () => {
            it('it should allow to refund payment', async () => {
                const { Escrow, addr2  } = await loadFixture(deployEscrowContract);

                expect(await Escrow.connect(addr2).refundPayment()).not.to.be.reverted;
            })
            it('it should not allow refund payment if ')
        })
    })
})
