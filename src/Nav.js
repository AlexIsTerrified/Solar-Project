import logo from './logo.svg'
import {useState, useEffect} from 'react'
	
function Nav(){
	const [menu,setMenu] = useState(false)
	const menuCl = () => {
		setMenu(!menu);
	}
	
	return (
			<>
			<div className={"menu "+(menu ? "close":"")} onClick={menuCl}>
				<div className="menu-1"></div>
				<div className="menu-2"></div>
				<div className="menu-3"></div>
			</div>
		<div className={"blank "+(menu ? "on":"")}  onClick={menuCl}></div>
	<nav className={(menu ? "menu-display":"")}>
		<div>
			<a href="?" target="blank">
			<img src={logo} />
			</a>
		</div>
		<div className="space"></div>
		<div>
		<a id="4" activeClassName="active-nav" href="/" exact><span>GALLERY</span></a>
		<a id="4" activeClassName="active-nav" href="/Resume"><span>PORTFOLIO</span></a>
		<a id="4" activeClassName="active-nav" href="/About"><span>ABOUT</span></a>
		<a id="4" activeClassName="active-nav" href="/Contact"><span>CONTACT</span></a>
		</div>
	</nav>
		</>
		);
	}
	
export default Nav;