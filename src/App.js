import logo from './logo.svg'
import './App.css'
import { Provider } from 'react-redux';
import Aligner from './Aligner'
import store from './state/store'

function App() {
  return (
    <div className="container">
	  <div className="main">
		<Provider store={store}>
			<Aligner/>
		</Provider>
	  </div>
    </div>
  );
}

export default App;
