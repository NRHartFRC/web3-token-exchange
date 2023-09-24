const config = require('../src/config.json') // using .. moves static compiler up one directory level

//tokens helper, could import from a common file (better alternative)
const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait = (seconds) =>{
	const milliseconds = seconds * 1000
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {

	//fetch accounts and contracts
	const accounts = await ethers.getSigners()

	//fetch network
	const { chainId } = await ethers.provider.getNetwork()
	console.log("Using chainId: ", chainId)

	//fetch deployed tokens (3X)
	const botany = await ethers.getContractAt('Token', config[chainId].botany.address)
	console.log(`\nBotany Token fetched: ${botany.address}\n`)

	const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address)
	console.log(`mETH Token fetched: ${mETH.address}\n`)

	const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address)
	console.log(`mDAI Token fetched: ${mDAI.address}\n`)

	//fetch deployed exchnage
	const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
	console.log(`Exchange fetched: ${exchange.address}\n`)

	//give tokens to another account to receive (account[1] setup signer)
	const sender = accounts[0]
	const receiver = accounts[1]
	let amount = tokens(10000)


	// user1 transfers 10,000 mETH to the receiver (user2)
	let transaction, result
	transaction = await mETH.connect(sender).transfer(receiver.address, amount)
	console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`)

	//setup exchange users (users plug wallet addresses into application)
	const user1 = accounts[0]
	const user2 = accounts[1]
	amount = tokens(10000)

	// user1 approves 10,000 BOT
	transaction = await botany.connect(user1).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Approved ${amount} tokens from ${user1.address}`)

	// user1 deposits 10,000 BOT
	transaction = await exchange.connect(user1).depositToken(botany.address, amount)
	await transaction.wait()
	console.log(`Deposited ${amount} Ether from ${user1.address}\n`)

	// user2 approves 10,000 mETH
	transaction = await mETH.connect(user2).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Approved ${amount} tokens from ${user2.address}`)

	// user2 deposits 10,000 mETH
	transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
	await transaction.wait()
	console.log(`Deposited ${amount} tokens from ${user2.address}\n`)


	///////////////////////////////////////
	//seed a canceled order
	
	//user1 makes order to get tokens
	let orderId
	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), botany.address, tokens(5))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}`)

	//user1 cancels order from ID from order Id of arg event
	orderId = result.events[0].args.id
	transaction = await exchange.connect(user1).cancelOrder(orderId)
	result = await transaction.wait()
	console.log(`Cancelled order from ${user1.address}\n`)

	//wait one second (gut check on testnet, delay promise resolve)
	await wait(1)

	
	///////////////////////////////////////
	//seed a fill order (two filled orders)

	//user1 makes fill order
	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), botany.address, tokens(10))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}`)

	//make user2 fill user1's fill order request
	orderId = result.events[0].args.id
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled order from ${user1.address}\n`)

	//wait one second
	await wait(1)

	//user1 makes another order
	transaction = await exchange.makeOrder(mETH.address, tokens(50), botany.address, tokens(15))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}`)

	//make user2 fills another order
	orderId = result.events[0].args.id
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled order from ${user1.address}\n`)

	//wait one second
	await wait(1)

	//user1 makes final order
	transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), botany.address, tokens(20))
	result = await transaction.wait()
	console.log(`Made order from ${user1.address}`)


	//make user2 fills final order
	orderId = result.events[0].args.id
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled order from ${user1.address}\n`)

	//wait one second
	await wait(1)

	///////////////////////////////////////
	//seed open orders (create order book) (makeOrder is get, val, give, val)

	//User1 makes ten orders
	for (let i=1; i <= 10; i++){
		transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), botany.address, tokens(10));
		result = await transaction.wait()

		console.log(`Made order from ${user1.address}`)

		await wait(1)
	}
	
	//User2 makes ten orders
	for (let j=1; j <= 10; j++){
		transaction = await exchange.connect(user2).makeOrder(botany.address, tokens(10), mETH.address, tokens(10 * j));
		result = await transaction.wait()

		console.log(`Made order from ${user2.address}`)

		await wait(1)
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
  		console.error(error);
  		process.exitCode = 1;
	});
