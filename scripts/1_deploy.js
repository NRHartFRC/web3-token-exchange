async function main() {

  console.log('Preparing deployment... \n') //migration script

  //Fetch contract to deploy from ethers library (grab artifacts, initcode transaction)
  const Token = await ethers.getContractFactory('Token')
  const Exchange = await ethers.getContractFactory('Exchange')

  //Fetch accounts (deploy exchange with fee account)
  const accounts = await ethers.getSigners()

  //Display accounts from account list
  console.log(`Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`)

  //Deploy multiple token contracts
  const botany = await Token.deploy('Botany', 'BOT', '1000000')
  await botany.deployed()
  console.log(`BOTANY Deployed to: ${botany.address}`)

  const mETH = await Token.deploy('mETH', 'mETH', '1000000')
  await mETH.deployed()
  console.log(`mETH Deployed to: ${mETH.address}`)

  const mDAI = await Token.deploy('mDAI', 'mDAI', '1000000')
  await mDAI.deployed()
  console.log(`mDAI Deployed to: ${mDAI.address}`)

  //deployed exchange with pre-set fees
  const exchange = await Exchange.deploy(accounts[1].address, 10) // 10% fee account
  await exchange.deployed()
  console.log(`Exchange Deployed to: ${exchange.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
