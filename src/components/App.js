import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import config from '../config.json';

import { 
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange
} from '../store/interactions';

function App() {

    const dispatch = useDispatch()

    //create javascript function to talk to metamask using RPC call (pull account)
    const loadBlockchainData = async () => {
        
        //connect ethers (library) to blockchain and create new provider (blockchain connection)
        const provider = loadProvider(dispatch)

        //fetch current network's chainId (e.g., hardhat: 31337, kovan: 42)
        const chainId = await loadNetwork(provider, dispatch) //chainId is inherited from provider object

        //fetch current account and balance from metamask
        await loadAccount(provider, dispatch)

        //load token smart contract
        const botany = config[chainId].botany
        const mETH = config[chainId].mETH
        await loadTokens(provider, [botany.address, mETH.address], dispatch)

        //load exchange smart contract
        const exchangeConfig = config[chainId].exchange
        await loadExchange(provider, exchangeConfig.address, dispatch)
    }

    useEffect(() => {
        loadBlockchainData()
    })

    return (
        <div>

      {/* Navbar */}

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          {/* Markets */}

          {/* Balance */}

          {/* Order */}

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}

        </section>
      </main>

      {/* Alert */}

    </div>
    );
}

export default App;
