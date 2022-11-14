//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
	address public feeAccount;
	uint256 public feePercent;

	//owners address, specific spender exchange address, specific number of tokens approved for EA
	mapping (address => mapping(address => uint256)) public tokens; //token address, user address, amount deposited

	//order mapping, database lookup (id is key, value is order stored in mapping)
	//pass in id and get order
	mapping(uint256 => _Order) public orders;

	//index number of orders created in smart contract
	uint256 public orderCount;

	//order cancel flag mapping
	mapping(uint256 => bool) public orderCancelled;

	//order filled flag mapping
	mapping(uint256 => bool) public orderFilled;

	//create deposit event
	event Deposit(
		address token,
		address user,
		uint256 amount,
		uint256 balance);
	
	//create Withdraw event
	event Withdraw(
		address token,
		address user,
		uint256 amount,
		uint256 balance
	);

	//create order event
	event Order(
		uint256 id, // unique identifier for an order
		address user, // user who made order
		address tokenGet, // address oftoken they receieve
		uint256 amountGet, // amount of token they get
		address tokenGive, // address of token they give
		uint256 amountGive, // amount of token they give
		uint256 timestamp
	);

	//create cancel event
	event Cancel(
		uint256 id, // unique identifier for an order
		address user, // user who made order
		address tokenGet, // address oftoken they receieve
		uint256 amountGet, // amount of token they get
		address tokenGive, // address of token they give
		uint256 amountGive, // amount of token they give
		uint256 timestamp
	);

	//create trade event
	event Trade(
		uint256 id,
		address user, //initates trade (taker)
		address tokenGet, //exact same value as order
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		address creator, //person who creates order
		uint256 timestamp
	);

	//approach to model 
	//define order struct (used underscore to avoid naming conflict)
	//create new struct for each order an put in mapping
	struct _Order {
		//attributes of an order
		uint256 id; // unique identifier for an order
		address user; // user who made order
		address tokenGet; // address oftoken they receieve
		uint256 amountGet; // amount of token they get
		address tokenGive; // address of token they give
		uint256 amountGive; // amount of token they give
		uint256 timestamp; // when order was created
	}

	constructor(address _feeAccount, uint256 _feePercent) {
		feeAccount = _feeAccount;
		feePercent = _feePercent;
	}

	//deposit & withdrawl tokens
	
	function depositToken(address _token, uint256 _amount) public {
		
		//transfer tokens to exchange (out of wallet to exchange)
		//add require to ensure error is on exchange level
		//know transfer happened or not at point of failure
		require(Token(_token).transferFrom(msg.sender, address(this), _amount));
		
		//update balance (track balance to see tokens on exchange)
		//create nested mapping that tracks deposits
		tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;

		//emit event (create trasaction history, alerts, read balance out of mapping)
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);

	}

	function withdrawToken(address _token, uint256 _amount) public {
		//transfer tokens to the user from exchange
		Token(_token).transfer(msg.sender, _amount);

		//update user balance (exchange reference, tokens are off exchange)
		tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
		
		//emit 
		emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);

	}
	
	//check balances using wrapper function
	function balanceOf(address _token, address _user)
		public
		view
		returns(uint256)
	{
		return tokens[_token][_user]; //read mapping using wrapper function vs expose mapping
	}

	//make & cancel orders

	function makeOrder(
		address _tokenGet, //token2 (do not have)
		uint256 _amountGet,
		address _tokenGive, //token1 (have want to give)
		uint256 _amountGive
	) public {

		//token give (the token they want to spend) - which token and how much
		//token get (the token they want to recieve) - which token and how much
		//require token balance before ordering
		require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

		//instantiate a new order
		orderCount++;
		orders[orderCount] = _Order (
			orderCount,
			msg.sender,
			_tokenGet,
			_amountGet,
			_tokenGive,
			_amountGive,
			block.timestamp
		);

		//emit event
		emit Order (
			orderCount,
			msg.sender,
			_tokenGet,
			_amountGet,
			_tokenGive,
			_amountGive,
			block.timestamp
		);
	}

	function cancelOrder(uint256 _id) public {
		//fetch order
		_Order storage _order = orders[_id];

		//ensure the caller of the function is the owner of the order
		require(address(_order.user) == msg.sender);
		
		//order must exist
		require(_order.id == _id);

		//cancel order
		orderCancelled[_id] = true;

		//emit cancel event
		emit Cancel(
			_order.id,
			msg.sender,
			_order.tokenGet,
			_order.amountGet,
			_order.tokenGive,
			_order.amountGive,
			block.timestamp
		);
	}

	function fillOrder(uint256 _id) public {
		//must be valid orderId
		require(_id > 0 && _id <= orderCount, 'order does not exist');

		//ensure order can't be filled
		require(!orderFilled[_id]);

		//ensure order is not cancelled
		require(!orderCancelled[_id]); //use bang '!' for not cancelled

		//fetch order
		_Order storage _order = orders[_id];

		//swapping tokens (trade)
		_trade(
			_order.id, 
			_order.user,
			_order.tokenGet,
			_order.amountGet,
			_order.tokenGive,
			_order.amountGive
		);
		
		//mark order as filled
		orderFilled[_order.id] = true; //use _order.id because reading directly from fetch
	}

	function _trade(
		uint256 _orderId, // unique identifier for an order
		address _user, // user who made order
		address _tokenGet, // address oftoken they receieve
		uint256 _amountGet, // amount of token they get
		address _tokenGive, // address of token they give
		uint256 _amountGive // amount of token they give
	) internal {
		//fee is deducted from amountGet
		uint256 _feeAmount = (_amountGet * feePercent) / 100;

		//execute trade - take from requestor (msg.sender pays fee)
		//msg.sender is the user who filled the order, _user is who created the order
		tokens[_tokenGet][msg.sender] = 
			tokens[_tokenGet][msg.sender] -
			(_amountGet + _feeAmount);

		tokens[_tokenGet][_user] = tokens[_tokenGet][_user] + _amountGet;

		//charge fees
		tokens[_tokenGet][feeAccount] =
			tokens[_tokenGet][feeAccount] +
			_feeAmount; 

		//give user1 balance token to user2
		tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive;
		tokens[_tokenGive][msg.sender] =
			tokens[_tokenGive][msg.sender] +
			_amountGive;
	
		//emit trade event

		emit Trade(
			_orderId,
			msg.sender,
			_tokenGet,
			_amountGet,
			_tokenGive,
			_amountGive,
			_user,
			block.timestamp
		);
	}
}
