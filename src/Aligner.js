import { MapContainer, TileLayer} from 'react-leaflet'
import {useState, useEffect,useCallback,useRef} from 'react'
import {FormControl,FormHelperText,Button,Tabs,Tab,TextField,InputAdornment} from '@mui/material';
import './leaflet.css'
import $ from 'jquery'
import compass from './compass.png'
import { Canvas ,useFrame} from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls,Text,Html} from '@react-three/drei'
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import {solar_declination,sun_position} from './solarCalc' 
import {getResults} from './SolarPositionCalc' 
Chart.register(...registerables);


export default function Aligner(){
	const [position, setPosition] = useState(0)
	const [form,setForm] = useState(0)
	const [content,setContent] = useState(0)
	const [width,setWidth] = useState(300)
	const [length,setLength] = useState(200)
	const [n_Width,nsetWidth] = useState(0)
	const [n_length,nsetLength] = useState(0)
	const [roof,setRoof] = useState('P')
	const [rAngle,setRAngle] = useState(30)
	const [map, setMap] = useState(null)
	const handleChange = (
		event: React.MouseEvent<HTMLElement>,
		newAlignment: number,
	  ) => {
		setForm(newAlignment);
	  };
	const handleContent = (
		event: React.MouseEvent<HTMLElement>,
		newAlignment: number,
	  ) => {
		setContent(newAlignment);
	  };
	const orbitalref = useRef(); 
	
	 
	 const handleWidth = (event) => {
		setWidth(event.target.value)
		resize_panel()
	 }
	 const handleLength = (event) => {
		setLength(event.target.value)
		resize_panel()
	 }
	 const handleRoof = (event) => {
		setRAngle(event.target.value > 45 ? 45 : event.target.value < 2 ? 2 : event.target.value)
	 }
	
	const resize_panel = () => {
			
			$('.animate').height(window.innerWidth*0.5)
			
			const size_sim = $('#size-sim')
			const size_panel = $('#size-panel')
			size_sim.height(size_sim.width());
			nsetWidth(width > 300 ? 300 : width < 50 ? 50 : width)
			nsetLength(length > 300 ? 300 : length < 50 ? 50 : length)
			
			
			if(length >= 6 && width >= 6){
				if(width <= length){
					size_panel.css("height","100%")
					size_panel.css("width",((n_Width/n_length)*100)+"%")
				}else{
					size_panel.css("width","100%")
					size_panel.css("height",((n_length/n_Width)*100)+"%")
				}
			}else{
				size_panel.width(size_sim.width()-5);
				size_panel.height(size_sim.height()/2)
			}
			
			const year_chart = $('#year-chart')
			if($('html').width() <= 680){
				year_chart.innerHeight($('.visual').width()/4) 
			}else{
			if($('.visual').width() > $('.visual').height()){
				year_chart.innerWidth($('.visual').height())
				year_chart.innerHeight($('.visual').height()/2)
			}else{
				year_chart.innerHeight($('.visual').width()/2) 
				year_chart.innerWidth($('.visual').width())
			}
			}
	}
				
	  const onClick = useCallback(() => {
		  map.locate().on("locationfound", function (e) {
			setPosition(e.latlng.lat > 70 ? 70 : e.latlng.lat < -70 ? -70 : e.latlng.lat)
			map.flyTo(e.latlng, 14);

		  });
		});

	  const onMove = useCallback(() => {
		setPosition(map.getCenter().lat > 70 ? 70 : map.getCenter().lat < -70 ? -70 : map.getCenter().lat)
	  }, [map])
	  
	const chartArray = [solar_declination(2022,1,21,12,0,0),
						solar_declination(2022,2,21,12,0,0),
						solar_declination(2022,3,21,12,0,0),
						solar_declination(2022,4,21,12,0,0),
						solar_declination(2022,5,21,12,0,0),
						solar_declination(2022,6,21,12,0,0),
						solar_declination(2022,7,21,12,0,0),
						solar_declination(2022,8,21,12,0,0),
						solar_declination(2022,9,21,12,0,0),
						solar_declination(2022,10,21,12,0,0),
						solar_declination(2022,11,21,12,0,0),
						solar_declination(2022,12,21,12,0,0)]

	useEffect(()=>{
		resize_panel()
		$( window ).resize(resize_panel)
		
		
		if(map != null){
			map.on('move', onMove)
		return () => {
		  map.off('move', onMove)
		}
		}
		if(position <0 && roof == 'S'){
			
		}
	
	})
	
	const Camera = () =>{
			useFrame(({ camera })=>{
				if(roof == 'S' && position < 0)
					$('.main .visual .animate .info img').css('transform', 'rotateX(45deg) rotateZ('+(-((orbitalref.current.getAzimuthalAngle()/Math.PI)*180)+270)+'deg)')
				else
				$('.main .visual .animate .info img').css('transform', 'rotateX(45deg) rotateZ('+(((orbitalref.current.getAzimuthalAngle()/Math.PI)*180)+270)+'deg)')
				
		})
	
		return (<>
			<PerspectiveCamera makeDefault position={[0.5,3,4]}/>
		<OrbitControls ref={orbitalref} minPolarAngle={1.1} target={[0,0.4,0]} maxPolarAngle={1.1} 
		maxAzimuthAngle={roof == 'P' ? Math.PI : roof == 'S' ? (position >= 0 ? -Math.PI : 0) : position >= 0 ? -Math.PI+0.5 : 0.5} 
		minAzimuthAngle={roof == 'P' ? -Math.PI : roof == 'S' ? (position >= 0 ? 0 : Math.PI)  : position >= 0 ?  -0.5 : Math.PI-0.5}   enableZoom={false}/>
		</>)
	}
	
	return(
		<>
		<Tabs className="visual-nav" value={content} onChange={handleContent} aria-label="wrapped label tabs example" centered>
		  <Tab value={0} label="Visualization" />
		  <Tab value={1} label="Chart" />
		</Tabs>
		<div className={"visual s"+content}>
			<div className="animate">
				<Canvas shadows>
					<Camera/>
					<directionalLight intensity={1} position={[position < 0 ? -Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*(10) : 
					Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*(10),
					10,0]} castShadow={true}/>
					<ambientLight intensity={0.5}/>
					{roof == 'S' ? <SolarSouth position={position} width={n_Width} length={n_length} angle={rAngle}/>  :
					(roof == 'E'? null : <SolarPlane position={position} width={n_Width} length={n_length}/>)
					}
				</Canvas>
				<div className="info">
					<img id="campass" src={compass}/>
				</div>
			</div>
			<div className="chart" id="year-chart">
				<Line data={{
			labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
		  datasets: [{
			label: 'Sunlight exposure on a flat plane',
			data: roof != 'P' ? chartArray.map((num)=>-Math.abs(num-(rAngle-position))) : chartArray.map((num)=>-Math.abs(num-position)),
			fill: false,
			borderColor: 'rgb(75, 192, 192)',
			tension: 0.15
			},{
			label: 'Sunlight exposure on this angled panel',
			data: chartArray.map((num)=>-Math.abs(num)),
			borderColor: 'rgb(192, 75, 75)',
			fill:false,
			tension: 0.15
			}]}} datasetIdKey={'1'}/>
			</div>
		</div>
		<div className="form">
				<Tabs value={form} onChange={handleChange} aria-label="wrapped label tabs example" centered>
				  <Tab value={0} label="Location" />
				  <Tab value={1} label="Panel" />
				  <Tab value={2} label="Placing" />
				</Tabs>
				<div className={"slider s"+form}>
				<div className="info">
					<b>First We Need Your Latitude</b>
							<div className="section">
							<button onClick={()=>{console.log(getResults(11.178401,-61.171875,2022,9,10,14,23,39))}}></button>
							<FormControl sx={{ width: '100%' }}>
								<FormHelperText>latitude: {position}</FormHelperText>
								<Button variant="contained"  onClick={onClick}>Get Location</Button>
								<FormHelperText>Click of the button above or use the map below to point to your location</FormHelperText>
							</FormControl>
							</div>
					<div className="section">
						<MapContainer center={[0.0, 0.0]} zoom={1} scrollWheelZoom={true} ref={setMap}>
						
						  <TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
						  />
						  <div className="pointer"></div>
						</MapContainer>
					</div>
					<div className="section">
						
					</div>
				</div>
				<div className="info">
					<b>Set The Specifications Of Your Panels</b>
					<div className="section">
					<FormControl className="panel-size">
						<TextField label="Width of your solar panels." inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' , max : 300,min:100}} type="number"
						onChange={handleWidth} defaultValue={width}
						InputProps={{endAdornment: <InputAdornment position="end">cm</InputAdornment>,}} required />
					</FormControl>
					<FormControl className="panel-size">
						<TextField label="Length of your solar panels."  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} type="number" 
						onChange={handleLength} defaultValue={length}
						InputProps={{endAdornment: <InputAdornment position="end">cm</InputAdornment>,}} required />
					</FormControl>
					</div>
					<div className="section" id="size-sim">
						<div id="size-panel">
							<div id="length">{n_length}cm</div>
							<div id="panel"></div>
							<div id="width">{n_Width}cm</div>
						</div>
					</div>
				</div>
				<div className="info">
					<b>Where Do You Plan On Placing Your Panels?</b>
					<div className="placing-buttons">
						<button className="placing-button" onClick={()=>{setRoof('P');}}><p>On A Flat Plane</p></button>
						<button className="placing-button" onClick={()=>{setRoof('S');}}><p>On A South Facing Rooftop</p></button>
					</div>
					{roof != 'P' ? <FormControl className="panel-size">
						<TextField label="Angle of your rooftop"  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} type="number" 
						onChange={handleRoof} defaultValue={rAngle}
						InputProps={{endAdornment: <InputAdornment position="end">Degrees</InputAdornment>,}} required />
					</FormControl> : null}
				</div>
			</div>
		</div>
		</>
	)
} 

function SolarPlane(props){
	const position = props.position
	const width = props.width
	const length = props.length
	const [angle,setAngle] = useState(0);
	const [opp,setOpp] = useState(0);
	const [adj,setAdj] = useState(0);
	function panelAngle(){
		
		if(position < -70 || position > 70){
			
			}else if(position.toFixed(0)>=0){
				setAngle(Math.PI*(Math.sin((Math.abs(position).toFixed(2))/180)));
				setOpp(Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(length/100));
				setAdj(-Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*(length/100));
			}else if(position.toFixed(0)<0){
				setAngle(-Math.PI*(Math.sin((Math.abs(position).toFixed(2))/180)));
				setOpp(Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(length/100));
				setAdj(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*(length/100));
			}else{
				setAngle(0);
			}
	}
	
	const Labels = () => {
		const wref = useRef()
		const lref = useRef()
		const aref = useRef()
		const oref = useRef()
		
		useFrame(({ camera }) => {
			wref.current.quaternion.copy(camera.quaternion)
			lref.current.quaternion.copy(camera.quaternion)
			aref.current.quaternion.copy(camera.quaternion)
			oref.current.quaternion.copy(camera.quaternion)
		  })
		
		return (
		<>
			<Text ref={wref} color="white" scale={[1.5,1.5,1.5]} position={[position.toFixed(2)<0 ? (adj/2)-0.2 : (adj/2)+0.2,opp+0.2,0]} 
			rotation={[-Math.PI*0.5,Math.PI/2,position.toFixed(0)<0 ? -Math.PI/2 : Math.PI/2]} outlineWidth={0.03} outlineColor="#444">
				{width/100}m
			</Text>
			<Text ref={lref} color="white" scale={[1.5,1.5,1.5]} position={[position.toFixed(2)<0 ? -0.2 : 0.2,(opp/2)+0.2,(width/200)+0.1]} 
			rotation={[0,0,-angle]} outlineWidth={0.03} outlineColor="#444">
				{length/100}m
			</Text>
			<Text ref={aref} color="white" scale={[1.5,1.5,1.5]} position={[0,0.3,(width/200)+0.1]} outlineWidth={0.03} outlineColor="#444">
				{Math.abs(adj.toFixed(2))}m
			</Text>
			<Text ref={oref} color="white" scale={[1.5,1.5,1.5]} position={[(adj/2),(opp/2)+0.02,  ((width/200)+0.1)]} outlineWidth={0.03} outlineColor="#444">
				{Math.abs(opp.toFixed(2))}m
			</Text>
			<Html scale={[2,2,2]} position={[position.toFixed(2)<0 ? -Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(0.05)+0.27 : Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(0.05)+0.27,
		(opp/2)+(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*0.05)+0.27, 0]} rotation={[0,0,angle]}>
				<span className="ani-angle">{Math.abs(position.toFixed(1))}<sup>&#8728;</sup>{position > 0 ? 'south' : 'north'}</span>
			</Html>
		</>
		)
	}
	
	
	useEffect(()=>{
		panelAngle()
	})
	
	return (
	<>
		<Labels/>
		<mesh position={[0,(opp/2)+0.07, 0]} rotation={[-Math.PI*0.5,angle,Math.PI/2]} castShadow receiveShadow>
		  <boxBufferGeometry args={[width/100, length/100, 0.1,10,10,10]} attach="geometry"/>
		  <meshPhongMaterial color={'#424242'} attach="material" shininess={95} flatShading={true} specular={'#996644'} />
		</mesh>
		<mesh position={[position.toFixed(2)<0 ? -Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(0.05) : Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(0.05),
		(opp/2)+(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*0.05)+0.07, 0]} rotation={[-Math.PI*0.5,angle,Math.PI/2]} castShadow receiveShadow>
		  <planeBufferGeometry args={[(width/100)-0.01, (length/100),(width/10),(length/10)]} attach="geometry"/>
		  <meshPhongMaterial color={'#222'} attach="material" wireframe={true} />
		</mesh>
		<mesh scale={1} position={[(adj/2),(opp/2)+0.02,  -((width/200)-0.14)]} 
		rotation={[-Math.PI*0.5,0,0]} castShadow receiveShadow>
		  <boxBufferGeometry args={[0.05, .2, opp-0.05,10,1,10]} attach="geometry" />
		  <meshPhongMaterial color={'#cfcfcf'} attach="material" wireframe={true} />
		</mesh>
		<mesh scale={1} position={[(adj/2),(opp/2)+0.02,  ((width/200)-0.14)]} 
		rotation={[-Math.PI*0.5,0,0]} castShadow receiveShadow>
		  <boxBufferGeometry args={[0.05, .2, opp-0.05,10,1,10]} attach="geometry" />
		  <meshPhongMaterial color={'#cfcfcf'} attach="material" wireframe={true} />
		</mesh>
		<mesh position={[0,0.04, ((width/200)-0.14)]} rotation={[Math.PI/2,0,Math.PI/2]} castShadow receiveShadow>
		  <planeBufferGeometry args={[0.2,-Math.abs(adj)]} attach="geometry"/>
		  <meshLambertMaterial color='#cfcfcf' attach="material"/>
		</mesh>
		<mesh position={[0, 0.04, -((width/200)-0.14)]} rotation={[Math.PI/2,0,Math.PI/2]} castShadow receiveShadow>
		  <planeBufferGeometry args={[0.2,-Math.abs(adj)]} attach="geometry"/>
		  <meshLambertMaterial color='#cfcfcf' attach="material"/>
		</mesh>
		<mesh position={[0, 0.02, -2]} rotation={[-Math.PI/2,0, 0]} castShadow receiveShadow>
		  <boxBufferGeometry args={[7,10,0.01]} attach="geometry"/>
		  <meshLambertMaterial color='red' attach="material"/>
		</mesh>
	</>
	);
}

function SolarSouth(props){
	const position = Math.abs(props.position)
	const NS = props.position >= 0
	const width = props.width
	const length = props.length
	const roof = Number(props.angle)
	const [angle,setAngle] = useState(0);
	const [opp,setOpp] = useState(0);
	const [adj,setAdj] = useState(0);
	const [rAngle,setRAngle] = useState(0);
	const [rOpp,setROpp] = useState(0);
	const [rHyp,setRHyp] = useState(0);
	function panelAngle(){
		
		if(position < -70 || position > 70){
			}else if(position.toFixed(0)>=0){
				setAngle(Math.PI*(Math.sin((Math.abs(position).toFixed(2))/180)));
				setRAngle(Math.PI*(Math.sin((Math.abs(roof).toFixed(2))/180)));
				
				if(position > roof){
					setAdj(-Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*(length/100));
					setROpp(-Math.tan((Math.PI*(Math.abs(roof).toFixed(2))/180))*(adj/2));
				}else{
					setAdj(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*(length/100));
					setROpp(Math.tan((Math.PI*(Math.abs(roof).toFixed(2))/180))*(adj/2));
				}
				setOpp(Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(length/100));
				setRHyp(-(adj)/Math.cos((Math.PI*(Math.abs(roof).toFixed(2))/180)));
				
			}else{
				setAngle(0);
			}
	}
	
	const Labels = () => {
		const wref = useRef()
		const lref = useRef()
		const aref = useRef()
		const oref = useRef()
		
		useFrame(({ camera }) => {
			wref.current.quaternion.copy(camera.quaternion)
			lref.current.quaternion.copy(camera.quaternion)
			aref.current.quaternion.copy(camera.quaternion)
			oref.current.quaternion.copy(camera.quaternion)
		  })
		
		return (
		<>
			<Text ref={wref} color="white" scale={[1.5,1.5,1.5]} position={[NS ? (adj/2)+0.2 : -(adj/2)-0.2,
			position < roof ? (rOpp)-(opp)+0.2: (opp)-(rOpp)+0.2,0]} 
			rotation={[-Math.PI*0.5,Math.PI/2, Math.PI/2]} outlineWidth={0.03} outlineColor="#444">
				{width/100}m
			</Text>
			<Text ref={lref} color="white" scale={[1.5,1.5,1.5]} position={[-0.2 : 0.2,position < roof ? (rOpp)-(opp/2)+0.27:-(rOpp)+(opp/2)+0.37,
			(width/200)+0.1]} 
			rotation={[0,0,-angle]} outlineWidth={0.03} outlineColor="#444">
				{length/100}m
			</Text>
			<Text ref={aref} color="white" scale={[1.5,1.5,1.5]} position={[0,0.3,(width/200)+0.1]} outlineWidth={0.03} outlineColor="#444">
				{Math.abs(rHyp.toFixed(2))}m
			</Text>
			<Text ref={oref} color="white" scale={[1.5,1.5,1.5]} position={[NS ? (adj/2) : -(adj/2),position < roof ? -(rOpp)-(((opp)-(rOpp*2))/2)+0.05 : (rOpp)+(((opp)-(rOpp*2))/2)+0.02,  
			(width/200)+0.1]} outlineWidth={0.03} outlineColor="#444">
				{Math.abs((position < roof ? (rOpp*2)-(opp) :(opp)-(rOpp*2)).toFixed(2))}m
			</Text>
			<Html scale={[2,2,2]} position={[position.toFixed(2)<0 ? -Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(0.05) : Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(0.05),
		position < roof ? position < 0 ? (rOpp)+(opp/2)+(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*0.05)+0.27
		: (rOpp)-(opp/2)+(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*0.05)+0.27
		:-(rOpp)+(opp/2)+(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*0.05)+0.27, 
		0]} rotation={[0,0,angle]}>
				<span className="ani-angle">{Math.abs(position.toFixed(1))}<sup>&#8728;</sup>{NS ? 'south' : 'north'}</span>
			</Html>
			<Html scale={[2,2,2]} position={[NS ? -Math.cos(Math.PI*(Math.abs(roof)/180))*(3.5) : Math.cos(Math.PI*(Math.abs(roof)/180))*(3.5),
			(Math.sin(Math.PI*(Math.abs(roof)/180))*(3.5))+0.27,0]} rotation={[0,0,angle]}>
				<span className="ani-angle">{Math.abs(roof.toFixed(1))}<sup>&#8728;</sup>{NS ? 'south' : 'north'}</span>
			</Html>
		</>
		)
	}
	
	
	useEffect(()=>{
		panelAngle()
	})
	
	return (
	<>
		<Labels/>
		<mesh position={[0,position < roof ? (rOpp)-(opp/2)+0.07:-(rOpp)+(opp/2)+0.07, 0]} rotation={[NS ? -Math.PI*0.5 : Math.PI*0.5,angle,Math.PI/2]} castShadow receiveShadow>
		  <boxBufferGeometry args={[width/100, length/100, 0.1,10,10,10]} attach="geometry"/>
		  <meshPhongMaterial color={'#424242'} attach="material" shininess={95} flatShading={true} specular={'#996644'} />
		</mesh>
		<mesh position={[!NS ? -Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(0.05) : Math.sin((Math.PI*(Math.abs(position).toFixed(2))/180))*(0.05),
		position < roof ? !NS ? (rOpp)-(opp/2)+(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*0.05)+0.07
		: (rOpp)-(opp/2)+(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*0.05)+0.07
		:-(rOpp)+(opp/2)+(Math.cos((Math.PI*(Math.abs(position).toFixed(2))/180))*0.05)+0.07, 
		0]} rotation={[NS ? -Math.PI*0.5 : Math.PI*0.5,angle,Math.PI/2]} castShadow receiveShadow>
		  <planeBufferGeometry args={[(width/100)-0.01, (length/100),(width/10),(length/10)]} attach="geometry"/>
		  <meshPhongMaterial color={'#222'} attach="material" wireframe={true} />
		</mesh>
		<mesh scale={1} position={[NS ? (adj/2) : -(adj/2),
		position < roof ? -(rOpp)-(((opp)-(rOpp*2))/2)+0.05 : (rOpp)+(((opp)-(rOpp*2))/2)+0.02,  -((width/200)-0.14)]} 
		rotation={[-Math.PI*0.5,0,0]} castShadow receiveShadow>
		  <boxBufferGeometry args={[0.05, .2, position < roof ? (rOpp*2)-(opp)+0.05 :(opp)-(rOpp*2)-0.05,10,1,10]} attach="geometry" />
		  <meshPhongMaterial color={'#cfcfcf'} attach="material" wireframe={true} />
		</mesh>
		<mesh scale={1} position={[NS ? (adj/2) : -(adj/2),
		position < roof ?  -(rOpp)-(((opp)-(rOpp*2))/2)+0.05 : (rOpp)+(((opp)-(rOpp*2))/2)+0.02,  ((width/200)-0.14)]} 
		rotation={[-Math.PI*0.5,0,0]} castShadow receiveShadow>
		  <boxBufferGeometry args={[0.05, .2, position < roof ? (rOpp*2)-(opp)+0.05 :(opp)-(rOpp*2)-0.05,10,1,10]} attach="geometry" />
		  <meshPhongMaterial color={'#cfcfcf'} attach="material" wireframe={true} />
		</mesh>
		<mesh position={[0,0.04, ((width/200)-0.14)]} rotation={[Math.PI/2,NS ? -rAngle : rAngle,Math.PI/2]} castShadow receiveShadow>
		  <planeBufferGeometry args={[0.2,-Math.abs(rHyp)]} attach="geometry"/>
		  <meshLambertMaterial color='#cfcfcf' attach="material"/>
		</mesh>
		<mesh position={[0,0.04, -((width/200)-0.14)]} rotation={[Math.PI/2,NS ? -rAngle : rAngle,Math.PI/2]} castShadow receiveShadow>
		  <planeBufferGeometry args={[0.2,-Math.abs(rHyp)]} attach="geometry"/>
		  <meshLambertMaterial color='#cfcfcf' attach="material"/>
		</mesh>
		<mesh position={[0, 0.02, -2]} rotation={[NS ? -Math.PI/2 : Math.PI/2,rAngle, 0]} castShadow receiveShadow>
		  <boxBufferGeometry args={[7,10,0.01]} attach="geometry"/>
		  <meshLambertMaterial color='red' attach="material"/>
		</mesh>
	</>
	);
}

