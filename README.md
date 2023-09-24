# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

# reference 25. PriceChart video, 20 min
## get order book generated from seed exchange script
start from scratch
1. npx hardhat node
2. new tap
   1. npx hardhat run --network localhost scripts/1_deploy.js
   2. npx hardhat run --network localhost scripts/2_seed_exchange.js
3. new tap
   1. npm run start
4. PriceChart.js
5. PriceChart.config.js
6. Selectors.js
7. App.js

# on 26. Trades
1. sort orders oldest first
2. apply colors
3. sort by date decending for UI
4. Trades.js, selectors.js

# 27. My orders
1. selectors new functions
2. Transactions.js


# 28. My Transactions
1. Transactions.js
2. selectors.js

# 29. Cancel orders
1. Transactions
2. interactions.js
3. reducers.js

cancel event emitted by Exchange.sol
we want to SubscribeToEvents to Cancel the order (dispatched to reducer)

add this in DEFAULT_EXCHANGE_STATE
cancelledOrders: {
        data: []
    },

# 30. Fill Orders
1. relaunch hardhat blockchain, migrate deployment and seed scripts, npm run start on separate taps
2. reset METAMASK: 
   1. HardHat #0, menu > settings > advanced > Clear activity tab data (resets account)
   2. HardHat #1, menu > settings > advanced > Clear activity tab data (resets account)
   3. Return back to HardHat #0 account

Note:
1. video shows a red candle when this happens on the minute scale (x-axis)
2. HardHat #0 has all of the sell orders
3. HardHat #1 has all the buy orders
4. HartHat#0 click on buy orders (do not want to fill own orders)

Orderbook.js // let people click on orders to fill them
Need to wire up handlers for each order on the page
Apply click handler to each order
Selling
- new onClick handler... onClick={() => fillOrderHandler(order)}
Buying
- new onClick handler for buy orders... onClick={() => fillOrderHandler(order)}

const fillOrderHandler = (order) => {
      console.log('fillOrderHandler', order)
      // fillOrder(provider, exchange, order, dispatch)
    }

create a function that fills order using an interaction (similar to Cancel)
dispatches action to redux store
when filled we subscribe to an event
lets the client application know it is filled
get out the redux state, UI updates automatically

Interacts with Exchange.sol
- emits Trade event if successful

Interactions
- subscribe to event, trade event

Reducers
- handle cases ORDER_FILL_REQUEST, ORDER_FILL_SUCCESS, ORDER_FILL_FAIL
- data may not exist in ORDER_FILL_SUCCESS, update default state in reducer DEFAULT_EXCHANGE_STATE
- Add this: 
  cancelledOrders: {
        data: []
    },
    filledOrders: {
        data: []
    },

- import OrderBook function
- useDispatch
- provider
- exchange

We are filling a buy order (we are selling!)

# 31. Transaction status
links out transaction hash to public block explorer (after deployment)
check it on etherscan, localhost will be on same page

Pluck the events to and from redux store, launch alert

Teardown exercise
1. HardHat
2. Scripts
3. Web Server
4. Accounts (HardHat #0, HardHat #1)
   
import Alert into App.js

Typo in TRANSACTION_REQUEST reducer transnaction

in selectors: const events = state => get(state, 'exchange.events')

Custom selector for MyEventsSelector

import into Alerts

The [0] index is the latest
- most recent event is first, see reducers.js, TRANSFER_SUCCESS

using config.json for dynamic block explorer feature

transaction hash only works when deployed

CHECK FOR LINTER ERRORS!

# 32. Deployment



# Apexcharts.JS
https://apexcharts.com
already saved in package.json