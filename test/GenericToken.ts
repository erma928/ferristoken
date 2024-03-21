import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { GenericToken } from '../typechain-types/contracts/GenericToken';

describe('GenericToken', function () {
  let genericToken: GenericToken;
  let initialSupply: BigNumber;
  let adminUser: SignerWithAddress;
  let userOne: SignerWithAddress;
  let userTwo: SignerWithAddress;
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    [adminUser, userOne, userTwo] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('GenericToken', adminUser);
    genericToken = (await factory.deploy('GenericToken', 'GT')) as GenericToken;
    initialSupply = BigNumber.from(1000000).mul(BigNumber.from(10).pow(18));
  });

  it('supports the ERC165 interface', async () => {
    expect(await genericToken.supportsInterface('0x01ffc9a7')).to.equal(true);
  });

  it('has a name', async () => {
    expect(await genericToken.name()).to.equal('GenericToken');
  });

  it('has a symbol', async () => {
    expect(await genericToken.symbol()).to.equal('GT');
  });

  it('has 18 decimals', async () => {
    expect(await genericToken.decimals()).to.equal(18);
  });

  it('returns the total amount of tokens', async () => {
    expect(await genericToken.totalSupply()).to.equal(initialSupply);
  });

  it('can be paused', async () => {
    expect(await genericToken.pause()).to.emit(genericToken, 'Paused');
  });

  it('cannot be paused twice', async () => {
    await genericToken.pause();
    await expect(genericToken.pause()).to.be.reverted;
  });

  it('can be unpaused', async () => {
    await genericToken.pause();
    expect(await genericToken.unpause()).to.emit(genericToken, 'Unpaused');
  });

  it('can mint tokens', async () => {
    await genericToken.mint(userOne.address, 1000);
    expect(await genericToken.balanceOf(userOne.address)).to.equal(1000);
  });

  it('can burn tokens', async () => {
    await genericToken.burn(initialSupply);
    expect(await genericToken.balanceOf(adminUser.address)).to.equal(0);
  });

  it('when the requested account has no tokens, it returns zero', async () => {
    expect(await genericToken.balanceOf(userOne.address)).to.equal(0);
  });

  it('when the requested account has some tokens, returns the total amount of tokens', async () => {
    expect(await genericToken.balanceOf(adminUser.address)).to.equal(initialSupply);
  });

  it('when the sender does not have enough balance, it reverts', async () => {
    await expect(genericToken.transfer(userOne.address, initialSupply.add(1))).to.be.revertedWith(
      'ERC20: transfer amount exceeds balance'
    );
  });

  it('transfers the requested amount', async () => {
    await genericToken.transfer(userOne.address, initialSupply);
    expect(await genericToken.balanceOf(adminUser.address)).to.equal(0);
    expect(await genericToken.balanceOf(userOne.address)).to.equal(initialSupply);
  });

  it('emits a transfer event', async () => {
    await expect(genericToken.transfer(userOne.address, initialSupply))
      .to.emit(genericToken, 'Transfer')
      .withArgs(adminUser.address, userOne.address, initialSupply);
  });

  it('when the recipient is the zero address, it reverts', async () => {
    await expect(genericToken.transfer(zeroAddress, initialSupply)).to.be.revertedWith(
      'ERC20: transfer to the zero address'
    );
  });

  it('when the spender has enough approved balance, transfers the requested amount', async () => {
    await expect(genericToken.approve(userOne.address, initialSupply))
      .to.emit(genericToken, 'Approval')
      .withArgs(adminUser.address, userOne.address, initialSupply);
    await expect(genericToken.connect(userOne).transferFrom(adminUser.address, userTwo.address, initialSupply))
      .to.emit(genericToken, 'Transfer')
      .withArgs(adminUser.address, userTwo.address, initialSupply);
    expect(await genericToken.balanceOf(adminUser.address)).to.equal(0);
    expect(await genericToken.balanceOf(userTwo.address)).to.equal(initialSupply);
    expect(await genericToken.allowance(adminUser.address, userOne.address)).to.equal(0);
  });

  it('when the token owner does not have enough balance, it reverts', async () => {
    await expect(genericToken.approve(userOne.address, initialSupply.add(1)))
      .to.emit(genericToken, 'Approval')
      .withArgs(adminUser.address, userOne.address, initialSupply.add(1));
    await expect(
      genericToken.connect(userOne).transferFrom(adminUser.address, userTwo.address, initialSupply.add(1))
    ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
  });

  it('when the spender does not have enough approved balance, it reverts', async () => {
    await expect(genericToken.approve(userOne.address, initialSupply.sub(1)))
      .to.emit(genericToken, 'Approval')
      .withArgs(adminUser.address, userOne.address, initialSupply.sub(1));
    await expect(
      genericToken.connect(userOne).transferFrom(adminUser.address, userTwo.address, initialSupply)
    ).to.be.revertedWith('ERC20: insufficient allowance');
  });

  it('when the token owner does not have enough balance, it reverts', async () => {
    await expect(genericToken.approve(userOne.address, initialSupply.add(1)))
      .to.emit(genericToken, 'Approval')
      .withArgs(adminUser.address, userOne.address, initialSupply.add(1));
    await expect(
      genericToken.connect(userOne).transferFrom(adminUser.address, userTwo.address, initialSupply.add(1))
    ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
  });

  it('when the recipient of transferFrom is the zero address, it reverts', async () => {
    await expect(genericToken.approve(userOne.address, initialSupply.add(1)))
      .to.emit(genericToken, 'Approval')
      .withArgs(adminUser.address, userOne.address, initialSupply.add(1));
    await expect(
      genericToken.connect(userOne).transferFrom(adminUser.address, zeroAddress, initialSupply.add(1))
    ).to.be.revertedWith('ERC20: transfer to the zero address');
  });
});
