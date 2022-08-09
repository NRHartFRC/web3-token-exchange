async function main() {
  //Fetch contract to deploy from ethers library (grab artifacts, initcode transaction)
  const Token = await ethers.getContractFactory("Token")

  //Deploy contract
  const token = await Token.deploy()
  await token.deployed()
  console.log(`Token Deployed to: ${token.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
