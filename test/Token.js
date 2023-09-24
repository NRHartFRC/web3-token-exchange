// Test script to ensure proper functionality

const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', ()=> {
	let token,
		accounts,
		deployer,
		receiver,
		exchange
	
	beforeEach(async () => {
		const Token = await ethers.getContractFactory('Token')
		token = await Token.deploy('Botany', 'BOT', '1000000') //get deployed instance
	
		accounts = await ethers.getSigners()
		deployer = accounts[0]
		receiver = accounts[1]
		exchange = accounts[2] //pretend exchange account
	})

	describe('Deployment', () => {
		const name = 'Botany'
		const symbol = 'BOT'
		const decimals = '18'
		const totalSupply = tokens('1000000')

		it('has correct name', async () => {
			expect(await token.name()).to.equal(name) //matchers like .to and .equal
		})

		it('has correct symbol', async () => {
			expect(await token.symbol()).to.equal(symbol) //matchers like .to and .equal
		})

		it('has correct decimals', async () => {
			expect(await token.decimals()).to.equal(decimals) //matchers like .to and .equal
		})

		it('has correct total supply', async () => {
			expect(await token.totalSupply()).to.equal(totalSupply)
		})

		it('assigned total supply to deployer', async () => {
			expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
		})

	})

	describe('Sending Tokens', () => {
		let amount, transaction, result

		describe('Success', () => {
		
			//execute before each test example
			beforeEach(async () => {
				amount = tokens(100)
				transaction = await token.connect(deployer).transfer(receiver.address, amount) //sign transactions / write value to blockchain
				result = await transaction.wait() //wait for block inclusion to inspect result
			})

			it('transfers Token balances', async () => {
				expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900)) //tokens()
				expect(await token.balanceOf(receiver.address)).to.equal((amount))
			})

			it('emits a Transfer event', async () => {
				const event = result.events[0] //event could be named otherwise
				//console.log(event)
				expect(event.event).to.equal('Transfer') //confirm event name (security check)

				const args = event.args
				expect(args.from).to.equal(deployer.address)
				expect(args.to).to.equal(receiver.address)
				expect(args.value).to.equal(amount)
			})
		})

		describe('Failure', () => {

			it('rejects insufficient balances', async () => {
				//transfer tokens with wrong amount (more than deployer has) - 10M
				const invalidAmount = tokens(100000000)
				await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
			})

			it('rejects invalid recipient', async () => {
				const amount = tokens(100)
				await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
			})
		})
	})

	describe('Approving Tokens', () => {
		let amount, transaction, result

		beforeEach(async () => {
			amount = tokens(100)
			transaction = await token.connect(deployer).approve(exchange.address, amount) //sign transactions / write value to blockchain
			result = await transaction.wait() //wait for block inclusion to inspect result
		})

		describe('Success', () => {

			it('allocates an allowance for delegated token spending', async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
			})

			it('emits an Approval event', async () => {
				const event = result.events[0] //event could be named otherwise
				//console.log(event)
				expect(event.event).to.equal('Approval') //confirm event name (security check)

				const args = event.args
				expect(args.owner).to.equal(deployer.address)
				expect(args.spender).to.equal(exchange.address)
				expect(args.value).to.equal(amount)
			})
			
		})

		describe('Failure', () => {
			it('rejects invalid spenders', async() => {
				await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
			})
		})
	})

	describe('Delegated Token Transfers', () => {
		
		let amount, transaction, result

		beforeEach(async () => {
			amount = tokens(100)
			transaction = await token.connect(deployer).approve(exchange.address, amount) //sign transactions / write value to blockchain
			result = await transaction.wait() //wait for block inclusion to inspect result
		})

		describe('Success', async () => {
			beforeEach(async () => {
				transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount) //facilitate swap
				result = await transaction.wait() //wait for block inclusion to inspect result
			})

			it('transfers token balances', async () => {
				expect(await token.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseUnits('999900', 'ether'))
				expect(await token.balanceOf(receiver.address)).to.be.equal(amount)
			})

			it('resets the allowance', async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)
			})

			it('emits a Transfer event', async () => {
				const event = result.events[0] //event could be named otherwise
				//console.log(event)
				expect(event.event).to.equal('Transfer') //confirm event name (security check)

				const args = event.args
				expect(args.from).to.equal(deployer.address)
				expect(args.to).to.equal(receiver.address)
				expect(args.value).to.equal(amount)
			})
		})

		describe('Failure', async () => {
			it('prevents overspending', async () => {
				//attempt to transer too many tokens
				const invalidAmount = tokens(100000000)
				await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
			})
		})
	})
})