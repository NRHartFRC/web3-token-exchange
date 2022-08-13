//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract Token {
	string public name;
	string public symbol;
	uint256 public decimals = 18;
	uint256 public totalSupply; // = 1000000 * (10**decimals); //WEI is 1000000 x 10^18

	//key-value pair
	mapping (address => uint256) public balanceOf;

	//owners address, specific spender exchange address, specific number of tokens approved for EA
	mapping (address => mapping(address => uint256)) public allowance;

	event Transfer(address indexed from,
		address indexed to,
		uint256 value
	);

	event Approval(address indexed owner,
		address indexed spender,
		uint256 value
	);

	constructor(
		string memory _name,
		string memory _symbol,
		uint256 _totalSupply
	) {
		name = _name; //take value passed in and assign to state value
		symbol = _symbol;
		totalSupply = _totalSupply * (10**decimals);
		balanceOf[msg.sender] = totalSupply; //dynamic write global sender ID key to get total supply data using mapping
	}

	function transfer(address _to, uint256 _value)
		public
		returns (bool success)
	{
		//require enough tokens in spenders balance (_ is local variable)
		require(balanceOf[msg.sender] >= _value); //require boolean can break compiler

		_transfer(msg.sender, _to, _value);

		return true;
	}

	function _transfer(
		address _from,
		address _to,
		uint256 _value
	) internal {
		require(_to != address(0)); //require reciever is not the sender, //throw error on boolean failure
		
		balanceOf[_from] = balanceOf[_from] - _value;
		balanceOf[_to] = balanceOf[_to] + _value;

		emit Transfer(_from, _to, _value);
	}


	function approve(address _spender, uint256 _value)
		public
		returns (bool success)
	{
		require(_spender != address(0));

		allowance[msg.sender][_spender] = _value;

		emit Approval(msg.sender, _spender, _value);
		return true;
	}

	function transferFrom(
		address _from,
		address _to,
		uint256 _value
	)
		public
		returns (bool success)
	{
		//require sufficient funds
		require(_value <= balanceOf[_from]);
		//check approval for transfer value specified
		require(_value <= allowance[_from][msg.sender]);

		//reset allowance to prevent double spending
		allowance[_from][msg.sender] = allowance[_from][msg.sender] - _value;

		//spend tokens
		_transfer(_from, _to, _value);

		return true;
	}
}
