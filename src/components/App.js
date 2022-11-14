import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import config from '../config.json';

import { 
  loadProvider,
  loadNetwork,
  loadAccount,
  loadToken
} from '../store/interactions';

function App() {

    const dispatch = useDispatch()

    //create javascript function to talk to metamask using RPC call (pull account)
    const loadBlockchainData = async () => {
        await loadAccount(dispatch)

        //connect ethers (library) to blockchain and create new provider (blockchain connection)
        const provider = loadProvider(dispatch)
        const chainId = await loadNetwork(provider, dispatch) //chainId is inherited from provider object

        //Token Smart Contract
        await loadToken(provider, config[chainId].botany.address, dispatch)

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
