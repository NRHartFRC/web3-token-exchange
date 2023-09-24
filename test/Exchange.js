// Test script to ensure proper functionality

const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', () => {
	let deployer,
		feeAccount,
		exchange
	
	const feePercent = 10

	beforeEach(async () => {
		const Exchange = await ethers.getContractFactory('Exchange')
		const Token = await ethers.getContractFactory('Token')

		token1 = await Token.deploy('Botany', 'BOT', '1000000')
		token2 = await Token.deploy('Mock Dai', 'mDAI', '1000000')

		accounts = await ethers.getSigners()
		deployer = accounts[0]
		feeAccount = accounts[1]
		user1 = accounts[2]
		user2 = accounts[3]
		
		let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
		await transaction.wait() //let the block get mined

		exchange = await Exchange.deploy(feeAccount.address, feePercent) //get deployed instance
	})

	describe('Deployment', () => {

		it('tracks the feeAccount', async () => {
			expect(await exchange.feeAccount()).to.equal(feeAccount.address) //matchers like .to and .equal
		})

		it('tracks the feePercent', async () => {
			expect(await exchange.feePercent()).to.equal(feePercent) //matchers like .to and .equal
		})
	})

	describe('Depositing Tokens', () => {
		let transaction, result
		let amount = tokens(10)


		describe('Success', () => {

			beforeEach(async () => {
				//console.log(user1.address, exchange.address, amount.toString())
				//approve Token
				transaction = await token1.connect(user1).approve(exchange.address,amount)
				result = transaction.wait()
				
				//deposit token
				transaction = await exchange.connect(user1).depositToken(token1.address, amount)
				result = await transaction.wait()
			})

			it('tracks token deposit', async () => {
				expect(await token1.balanceOf(exchange.address)).to.equal(amount)
				expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
				expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
			})

			it('emits a Deposit event', async () => {
				const event = result.events[1] //event could be named otherwise (if two events are emitted, index 1 (two fact))
				//console.log(event)
				expect(event.event).to.equal('Deposit') //confirm event name (security check)

				const args = event.args
				expect(args.token).to.equal(token1.address)
				expect(args.user).to.equal(user1.address)
				expect(args.amount).to.equal(amount)
				expect(args.balance).to.equal(amount)
			})		
		})

		describe('Failure', () => {
			it('fails when no tokens are approved', async () => {
				//don't approve any tokens without depositing
				await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
			})
		})
	})

	describe('Withdrawing Tokens', () => {
		let transaction, result
		let amount = tokens(10)


		describe('Success', () => {

			beforeEach(async () => {
				//deposit tokens before withdraw
				
				//approve token
				transaction = await token1.connect(user1).approve(exchange.address,amount)
				result = transaction.wait()
				
				//deposit token
				transaction = await exchange.connect(user1).depositToken(token1.address, amount)
				result = await transaction.wait()

				//withdraw tokens
				transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
				result = await transaction.wait()
			})

			it('withdraws token funds', async () => {
				expect(await token1.balanceOf(exchange.address)).to.equal(0)
				expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
				expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
			})

			it('emits a Withdraw event', async () => {
				const event = result.events[1] //event could be named otherwise (if two events are emitted, index 1 (two fact))
				expect(event.event).to.equal('Withdraw') //confirm event name (security check)

				const args = event.args
				expect(args.token).to.equal(token1.address)
				expect(args.user).to.equal(user1.address)
				expect(args.amount).to.equal(amount)
				expect(args.balance).to.equal(0)
			})		
		})

		describe('Failure', () => {
			it('fails when no tokens are approved', async () => {
				//don't approve any tokens without depositing
				await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
			})
		})
	})

	describe('Checking balances', () => {
		let transaction, result
		let amount = tokens(1)

		beforeEach(async () => {
			//console.log(user1.address, exchange.address, amount.toString())
			//deposit tokens before checking balance
				
			//approve Token
			transaction = await token1.connect(user1).approve(exchange.address,amount)
			result = transaction.wait()
				
			//deposit token
			transaction = await exchange.connect(user1).depositToken(token1.address, amount)
			result = await transaction.wait()
		})

		it('returns user balance', async () => {
			expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
		})
	})

	describe('Making orders', async () => {
    	let transaction, result
    	let amount = tokens(1)

    	describe('Success', async () => {
     	 	beforeEach(async () => {
        		// Deposit tokens before making order

       			// Approve Token
        		transaction = await token1.connect(user1).approve(exchange.address, amount)
        		result = await transaction.wait()
        	
        		// Deposit token
        		transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        		result = await transaction.wait()

        		// Make order
        		transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
        		result = await transaction.wait()
      		})

      		it('tracks the newly created order', async () => {
       			expect(await exchange.orderCount()).to.equal(1)
     		})

      		it('emits an order event', async () => {
        		const event = result.events[0]
        		expect(event.event).to.equal('Order')

        		const args = event.args
        		expect(args.id).to.equal(1)
        		expect(args.user).to.equal(user1.address)
        		expect(args.tokenGet).to.equal(token2.address)
       			expect(args.amountGet).to.equal(tokens(1))
        		expect(args.tokenGive).to.equal(token1.address)
        		expect(args.amountGive).to.equal(tokens(1))
        		expect(args.timestamp).to.at.least(1)
      		})
    	})

    	describe('Failure', async () => {
     		it('Rejects with no balance', async () => {
        		await expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))).to.be.reverted
      		})
   		})
  	})

	describe('Order actions', async () => {
		let transaction, result
		let amount = tokens(1) //user1 tokens

		beforeEach(async () => {
			// user1 deposits tokens before making order

       		// Approve Token
        	transaction = await token1.connect(user1).approve(exchange.address, amount)
        	result = await transaction.wait()
        	
        	// Deposit token
        	transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        	result = await transaction.wait()

        	// Give tokens to user2
        	transaction = await token2.connect(deployer).transfer(user2.address, tokens(100))
        	result = await transaction.wait()

        	// user2 deposits tokens
        	transaction = await token2.connect(user2).approve(exchange.address, tokens(2))
        	result = await transaction.wait()

        	// user2 
        	transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2))
        	result = transaction.wait()

        	// Make order
        	transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
        	result = await transaction.wait()
		})

		describe('Cancelling orders', async () => {
			
			describe('Success', async () => {
				
				beforeEach(async () => {
					transaction = await exchange.connect(user1).cancelOrder(1)
					result = await transaction.wait()
				})

				it('updates canceled orders', async () => {
					expect(await exchange.orderCancelled(1)).to.equal(true) //order ID 1 is cancelled
				})

				it('emits a cancel event', async () => {
        			const event = result.events[0]
        			expect(event.event).to.equal('Cancel')

        			const args = event.args
        			expect(args.id).to.equal(1)
        			expect(args.user).to.equal(user1.address)
        			expect(args.tokenGet).to.equal(token2.address)
       				expect(args.amountGet).to.equal(tokens(1))
        			expect(args.tokenGive).to.equal(token1.address)
        			expect(args.amountGive).to.equal(tokens(1))
        			expect(args.timestamp).to.at.least(1)
      			})
			})

			describe('Failure', async () => {
				beforeEach(async () => {
					transaction = await token1.connect(user1).approve(exchange.address, amount)
		        	result = await transaction.wait()
		        	
		        	// Deposit token
		        	transaction = await exchange.connect(user1).depositToken(token1.address, amount)
		        	result = await transaction.wait()

		        	// Make order
		        	transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
		        	result = await transaction.wait()
				})

				it('rejects invalid order IDs', async () => {
		        	const invalidOrderID = 99999
		        	await expect(exchange.connect(user1).cancelOrder(invalidOrderID)).to.be.reverted
				})
			
				it('rejects invalid cancellations', async () => {
		        	await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
				})
			})
		})

		describe('Filling orders', async () => {

			describe('Success', async () => {
				beforeEach(async () => {
					// user2 fills order
		        	transaction = await exchange.connect(user2).fillOrder('1')
		        	result = await transaction.wait()
				})

				it('executes the trade and charges fees', async () => {
					//ensure trade happens
					// Token Give
					expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(tokens(0))
					expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1))
					expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(tokens(0))
				

					// Token Get
					expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1)) // have 1 mDAI
					expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9))
					expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1))
				})

				it('updates filled orders', async () => {
					expect(await exchange.orderFilled(1)).to.equal(true)
				})

				it('emits an trade event', async () => {
	        		const event = result.events[0]
	        		expect(event.event).to.equal('Trade')

	        		const args = event.args
	        		expect(args.id).to.equal(1)
	        		expect(args.user).to.equal(user2.address) // fills order
	        		expect(args.tokenGet).to.equal(token2.address) //same as order
	       			expect(args.amountGet).to.equal(tokens(1))
	        		expect(args.tokenGive).to.equal(token1.address) //same as order
	        		expect(args.amountGive).to.equal(tokens(1))
	        		expect(args.creator).to.equal(user1.address)
	        		expect(args.timestamp).to.at.least(1)
	      		})
			})

			describe('Failure', async () => {
				it('rejects invalid orer IDs', async () => {
					const invalidOrderID = 99999
					await expect(exchange.connect(user2).fillOrder(invalidOrderID)).to.be.reverted
				})

				it('rejects already filled orders', async () => {
					transaction = await exchange.connect(user2).fillOrder(1)
					await transaction.wait()
					await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted //can't be filled twice
				})

				it('rejects canceled orders', async () => {
					transaction = await exchange.connect(user1).cancelOrder(1)
					await transaction.wait()

					await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
				})
			})
		})
	})
})
