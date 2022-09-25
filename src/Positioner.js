import { MapContainer, TileLayer} from 'react-leaflet'
import {useState, useEffect,useMemo,useRef,useCallback} from 'react'
import {FormControl,TextField,InputAdornment,Stack,Tabs,Tab} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import './leaflet.css'
import $ from 'jquery'
import compass from './compass.png'
import { Canvas ,useFrame} from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls,Text,Html,Line} from '@react-three/drei'
import * as THREE from 'three';
import { EllipseCurve } from 'three'

import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

import { extend } from '@react-three/fiber';
import {result} from './SolarPositionCalc' 

extend({ Line2,LineMaterial,LineGeometry });

export default function Positioner(){
	const [date, setDate] = useState(new Date());
	const [latitude, setLatitude] = useState(51.53191203493799);
	const [longitude, setLongitude] = useState(0);
	const [results,setResults] = 
	useState(result(latitude,longitude,date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate(),date.getUTCHours,date.getUTCMinutes(),date.getUTCSeconds()))
	const [map, setMap] = useState(null)
	const [mapActive, setMapActive] = useState(true)
	const [mapText, setMapText] = useState(false)
	const [visual,setVisual] = useState(0)
	
	const handleVisual = (event,newAlignment) => {
		setVisual(newAlignment);
	  };
	
	const handleDateAndTime = (v) => {
		setDate(v.$d);
	  };
	  
	const handleLatitude = async(event) => {
		await setMapActive(false)
		await setLatitude(event.target.value || 0)
		await map.setView([event.target.value, longitude]);
		await setMapActive(true)
	}
	const handleLongitude = async (event) => {
		await setMapActive(false)
		await setLongitude(event.target.value || 0)
		await map.setView([latitude,event.target.value]);
		await setMapActive(true)
	}
	
	const getResults = (lat,lon,date)=>{
		var year = date.getUTCFullYear()
		var month = date.getUTCMonth()+1
		var day = date.getUTCDate()
		var hour = date.getUTCHours()
		var minute = date.getUTCMinutes()
		var second = date.getUTCSeconds()

		setResults(result(lat,lon,year,month,day,hour,minute,second))
		return result(lat,lon,year,month,day,hour,minute,second)
	}
	
	const hourToTime = (h) => {
		var noon = false
		var hour = Math.floor(h)
		var minutes = (h-hour)*60
		var seconds = (minutes-Math.floor(minutes))*60
		minutes = Math.floor(minutes)
		seconds = Math.floor(seconds)
		
		var UTCDate = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()-1,date.getUTCDate(),hour,minutes,seconds))

		return UTCDate.toLocaleTimeString()
	}
	
	const getGMT = () => {
		var UTCDate = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()-1,date.getUTCDate(),date.getUTCHours(),date.getUTCSeconds(),date.getUTCSeconds()))
		
		var utc = -(date.getTimezoneOffset(UTCDate)/60)
		
		return "GMT "+utc+":00"
	}
	
	const onMove = useCallback(async() => {
		if(mapActive){
			await setMapText(false)
			await setLatitude(map.getCenter().lat || 0)
			await setLongitude(map.getCenter().lng || 0)
			await setMapText(true)
		}
	  }, [map])
	
	useEffect(()=>{
		if(map != null){
			map.on('move', onMove)
		return () => {
		  map.off('move', onMove)
		}
		}
	})

	useEffect(()=>{
		getResults(latitude,longitude,date)
		
	},[date,latitude,longitude,map])
	
	return (
		<div className="positioner">
			<div className="visual-nav">
				<Tabs className="visual-nav" value={visual} onChange={handleVisual} centered>
				  <Tab value={0} label="Graphic" />
				  <Tab value={1} label="Map" />
				</Tabs>
			</div>
			<div className={"visual v"+visual}>
				<div className="animate">
					<div className="info">
						<span className="az">Azimuth : {results.az.toFixed(2)}&deg;</span>
						<span className="el">Elevation : {results.el.toFixed(2)}&deg;</span>
						<span>Declination : {results.dec.toFixed(2)}&deg;</span>
						<span>Timezone: {getGMT()}</span>
						<span>Sunrise : {hourToTime(results.sunrise)}</span>
						<span>Sunset : {hourToTime(results.sunset)}</span>
						<span>Noon : {hourToTime(results.transit)}</span>
					</div>
					<Canvas shadows>
						<PerspectiveCamera makeDefault position={[-Math.PI,2.5,3.5]} filmOffset={-6} />
						<OrbitControls  target={[0,0.1,0]} enableZoom={false}/>
						<directionalLight intensity={1} position={[0,10,0]} castShadow={true}/>
						<ambientLight intensity={0.2}/>
						<Globe azimuth={results.az} elevation={results.el} dec={results.dec} />
					</Canvas>
				</div>
				<div className="map">
					<MapContainer center={[latitude, longitude]} zoom={1} scrollWheelZoom={true} ref={setMap}>
						
						  <TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
						  />
						  <div className="pointer"></div>
					</MapContainer>
				</div>
			</div>
			<div className="form">
			<div className="section">
				<h1>Solar Position Calculator</h1>
				<p>Based on equations from <i>Astronomical Algorithms</i> by Jean Meenus.</p>
			</div>
				<div className="section">
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<Stack spacing={2}>
							<MobileDatePicker
							  label="Date"
							  inputFormat="DD/MM/YYYY"
							  value={date}
							  onChange={handleDateAndTime}
							  renderInput={(params) => <TextField {...params} />}
							/>
							<TimePicker
							  label="Time"
							  value={date}
							  onChange={handleDateAndTime}
							  renderInput={(params) => <TextField {...params} />}
							  views={['hours','minutes','seconds']}
							  inputFormat="hh:mm:ss A"
							/>
						</Stack>
					</LocalizationProvider>
				</div>
				<div className="section">
					<Stack spacing={2}>
						<TextField label="Latitude" type="number" step={0.1}
						onChange={handleLatitude} value={latitude} disabled/>
					
						<TextField label="Longitude" type="number" step={0.1}
						onChange={handleLongitude} value={longitude} disabled/>
					</Stack>
				</div>
			</div>
		</div>
	)
}

function Globe(props){
	const [x,setX] = useState(0)
	const [y,setY] = useState(0)
	const [z,setZ] = useState(0)
	const [hyp,setHyp] = useState(0)
	
	const ElevationAngle = (props)=> {
	  const geometry = useMemo(() => {
		const vertices = [];
		const divisions = 50;

		for (let i = 0; i <= divisions; i++) {
		  const v = (i / divisions) * ((props.elevation/180)*Math.PI);
		  const x = Math.sin(v)*2;
		  const y = Math.cos(v)*2;
		  vertices.push(x, y, 0);
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
		  "position",
		  new THREE.Float32BufferAttribute(vertices, 3)
		);
		return geometry;
	  }, []);
	  return (
		<line
		  onUpdate={(line) => line.computeLineDistances()}
		  geometry={geometry}
		  position={props.position}
		  rotation={props.rotation}
		>
		  <lineDashedMaterial color="orange" dashSize={1/10} gapSize={1/30} lineWidth={10} />
		</line>
	  );
	}
	
	const AzimuthAngle = (props)=> {
	  const geometry = useMemo(() => {
		const vertices = [];
		const divisions = 90;

		for (let i = 0; i <= divisions; i++) {
		  const v = (i / divisions) * ((props.azimuth/180)*Math.PI);
		  const x = Math.sin(v)*props.hyp;
		  const y = Math.cos(v)*props.hyp;
		  vertices.push(x, y, 0);
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
		  "position",
		  new THREE.Float32BufferAttribute(vertices, 3)
		);
		return geometry;
	  }, []);
	  return (
		<line
		  onUpdate={(line) => line.computeLineDistances()}
		  geometry={geometry}
		  position={props.position}
		  rotation={props.rotation}
		>
		  <lineDashedMaterial color="red" dashSize={1/10} gapSize={1/30} lineWidth={10} />
		</line>
	  );
	}
	
	const ToSunAngle = (props) => {
		const geometry = useMemo(() => {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
		  "position",
		  new THREE.Float32BufferAttribute([0,0,0,props.position[0],props.position[1],props.position[2]], 3)
		);
		return geometry;
	  }, []);
	  return (
		<line
		  onUpdate={(line) => line.computeLineDistances()}
		  geometry={geometry}
		  position={[0,0,0]}
		  rotation={[0,0,0]}
		>
		  <lineBasicMaterial color="white" lineWidth={10} />
		</line>
	  );
	}
	
	const CompassLines = (props) => {
		const geometry = useMemo(() => {
		const vertices = [];
		const divisions = 90;

		for (let i = 0; i <= divisions; i++) {
		  const v = (i / divisions) * (2*Math.PI);
		  const x = Math.sin(v)*2;
		  const y = Math.cos(v)*2;
		  vertices.push(x, y, 0);
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
		  "position",
		  new THREE.Float32BufferAttribute(vertices, 3)
		);
		return geometry;
	  }, []);
	  return (
		<line
		  onUpdate={(line) => line.computeLineDistances()}
		  geometry={geometry}
		  position={props.position}
		  rotation={props.rotation}
		>
		  <lineBasicMaterial color="#55f" lineWidth={2} />
		</line>
	  );
	}
	
	const sunLocation = (elevation,azimuth) => {
		var x = 0;
		var y = 0;
		var z = 0;
		var hyp = 0;
		
		x = Math.sin((Math.PI/2)-((elevation/180)*Math.PI))*2
		hyp = x
		y = Math.cos((Math.PI/2)-((elevation/180)*Math.PI))*2
		z = (Math.sin(((azimuth < 90 ? 90-azimuth : azimuth < 180 ? azimuth-90 : azimuth < 270 ? azimuth-90 : 360-azimuth-270 )/180)*Math.PI))*(x)
		x = (Math.cos(((azimuth < 90 ? 90-azimuth : azimuth < 180 ? azimuth-90 : azimuth < 270 ? azimuth-90 : 360-azimuth-270 )/180)*Math.PI))*(x)
		
		z = azimuth < 90 || props.azimuth > 270 ? -z : z
		//x = azimuth > 180 ? -x : x
		
		setX(x)
		setY(y)
		setZ(z)
		setHyp(hyp)
	}
	
	useEffect(()=>{
		sunLocation(props.elevation,props.azimuth)
	})
	
	const CompassLabels = () => {
		const north = useRef()
		const south = useRef()
		const east = useRef()
		const west = useRef()
		
		useFrame(({ camera }) => {
			north.current.quaternion.copy(camera.quaternion)
			south.current.quaternion.copy(camera.quaternion)
			east.current.quaternion.copy(camera.quaternion)
			west.current.quaternion.copy(camera.quaternion)
		  })
		
		
		return (
			<>
			<Text ref={north} position={[0,0,-2.2]} scale={[3,3,3]} color="yellow" >
			N
			</Text>
			<Text ref={south} position={[0,0,2.2]} scale={[2,2,2]}>
			S
			</Text>
			<Text ref={east} position={[2.2,0,0]} scale={[2,2,2]}>
			E
			</Text>
			<Text ref={west} position={[-2.2,0,0]} scale={[2,2,2]}>
			W
			</Text>
			</>
		);
	}
	
	return (
	<>
		<CompassLabels/>
		<mesh position={[0, 0, 0]} rotation={[Math.PI,0,0]} castShadow receiveShadow>
			<cylinderBufferGeometry args={[2,2,.1,32]} attach="geometry"/>
			<meshBasicMaterial color='green'  transparent={true} opacity={0.95} attach="material"/>
		</mesh>
		<mesh position={[x, y, z]}>
			<sphereBufferGeometry args={[1/12,30,30]} attach="geometry"/>
			<meshLambertMaterial color='yellow' attach="material"/>
		</mesh>
		<mesh position={[0,0,0]}>
			<sphereBufferGeometry args={[2.02,30,30]} attach="geometry" castShadow receiveShadow/>
			<meshBasicMaterial color={props.elevation>0 ? '#647c85' : '#151B54'} transparent={true} opacity={0.3} attach="material"/>
		</mesh>
		<ElevationAngle position={[0,0,0]} rotation={[0,-((props.azimuth+90)/180)*Math.PI,Math.PI/2]} elevation={props.elevation}/>
		<AzimuthAngle position={[0,y,0]} rotation={[-Math.PI/2,0,0]} azimuth={props.azimuth} hyp={hyp} />
		<CompassLines position={[0,0,0]} rotation={[0,0,0]} />
		<CompassLines position={[0,0,0]} rotation={[0,Math.PI/2,0]} />\
		<ToSunAngle position={[x,y,z]} />
	</>
	)
}