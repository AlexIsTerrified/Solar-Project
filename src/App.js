import {Route,BrowserRouter as Router,Routes,NavLink as Link} from 'react-router-dom'
import './App.css'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {WbTwilight, SolarPower } from '@mui/icons-material';
import logo from './vercel.svg'
import Positioner from './Positioner'
import Aligner from './Aligner'

function App() {
	const darkTheme = createTheme({
		  palette: {
			mode: 'dark',
		  },
		});
	
	
  return (
	<Router>
		<div className="nav">
			<div className="box">
				<Link className="tab" to="/" exact>
					<div className="icon">
					<WbTwilight/>
					</div>
					<p>Solar orbit</p>
				</Link>
				<Link className="tab" to="/Solar-panel-aligner">
					<div className="icon">
						<SolarPower/>
					</div>
					<p>Solar panel</p>
				</Link>
			</div>
		</div>
		<div className="container">
			<ThemeProvider theme={darkTheme}>
			<CssBaseline />
			<Routes>
				<Route path="/Solar-panel-aligner" element={<Aligner/>}/>
				<Route path="/" element={<Positioner/>}/>
			</Routes>
			</ThemeProvider>
		</div>
	</Router>
  );
}

export default App;
