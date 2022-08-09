const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', ()=> {
	let token
	
	beforeEach( async () => {
		const Token = await ethers.getContractFactory('Token')
		token = await Token.deploy('Botany', 'BOT', '1000000') //get deployed instance
	})

	describe('Deployment', ()=> {
		const name = 'Botany'
		const symbol = 'BOT'
		const decimals = 18
		const totalSupply = 1000000

		it('has correct name', async ()=> {
			expect(await token.name()).to.equal(name) //matchers like .to and .equal
		})

		it('has correct symbol', async ()=> {
			expect(await token.symbol()).to.equal(symbol) //matchers like .to and .equal
		})

		it('has correct decimals', async ()=> {
			expect(await token.decimals()).to.equal(decimals) //matchers like .to and .equal
		})

		it('has correct total supply', async ()=> {
			expect(await token.totalSupply()).to.equal(tokens(totalSupply)) //matchers like .to and .equal
		})

	})

})