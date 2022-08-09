//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract Token {
	string public name;
	string public symbol;
	uint256 public decimals = 18;
	uint256 public totalSupply; // = 1000000 * (10**decimals); //WEI is 1000000 x 10^18

	constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
		name = _name; //take value passed in and assign to state value
		symbol = _symbol;
		totalSupply = _totalSupply * (10**decimals);
	}
}
