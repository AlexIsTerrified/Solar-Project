

export function calc_time(year,month,day,hour=12,minute=0,sec=0){
	const month_days = [0,31,28,31,30,31,30,31,31,30,31,30]
	month_days.forEach((d,i)=>{
		if(i<=month-1)day = day + d;
	})
	const leapyear = year % 400 == 0 ? true : year % 100 == 0 ? false : year % 4 == 0 ? true : false
	const leapdays = leapyear && day >= 60 && (!(month==2 && day==60))
	if(leapdays)day = day + 1
	
	hour = hour + (minute / 60.0) + (sec / 3600.0)
	
	const delta = year - 1949
	const leap = Math.trunc(delta / 4)
	
	const jd = 32916.5 + delta * 365 + leap + day + hour / 24.0
	
	return jd - 51545
}

export function sun_position(year=2022, month=12, day=22, hour=12, minute=0, sec=0,lat=0, longitude=6.5){
	const twopi = 2 * Math.PI
    const deg2rad = Math.PI / 180

    const time = calc_time(year, month, day, hour, minute, sec)	
	
	let mnlong = 280.46 + 0.9856474 * time
    mnlong = mnlong % 360
	
	if(mnlong < 0)mnlong = mnlong + 360
	
	let mnanom = 357.528 + 0.9856003 * time
    mnanom = mnanom % 360
	if(mnanom < 0)mnanom = mnanom + 360
	mnanom = mnanom * deg2rad
	
	let eclong = mnlong + 1.915 * Math.sin(mnanom) + 0.02 * Math.sin(2 * mnanom)
    eclong = eclong % 360
    if(eclong < 0) eclong = eclong + 360
    let oblqec = 23.439 - 0.0000004 * time
    eclong = eclong * deg2rad
    oblqec = oblqec * deg2rad
	
	const num = Math.cos(oblqec) * Math.sin(eclong)
    const den = Math.cos(eclong)
    let ra = Math.atan(num / den)
    if(den < 0) ra = ra + Math.PI
    if(den >= 0 && num < 0) ra = ra + twopi
    const dec = Math.asin(Math.sin(oblqec) * Math.sin(eclong))
	
	let gmst = 6.697375 + 0.0657098242 * time + hour
    gmst = gmst % 24
    if(gmst < 0) gmst = gmst + 24
	
	let lmst = gmst + longitude / 15.0
    lmst = lmst % 24
    if(lmst < 0) lmst = lmst + 24
    lmst = lmst * 15 * deg2rad
	
	let ha = lmst - ra
    if(ha < -Math.PI) ha = ha + twopi
    if(ha > Math.PI) ha = ha - twopi
	
	lat = lat * deg2rad
	
	let zenithAngle = Math.acos(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha))

    let az = Math.acos(((Math.sin(lat) * Math.cos(zenithAngle)) - Math.sin(dec)) / (Math.cos(lat) * Math.sin(zenithAngle)))

    let el = Math.asin(Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha))
	
	el = el / deg2rad
    az = az / deg2rad

    if(ha > 0) az = az + 180; else az = 540 - az;
    az = az % 360
	
	var HA = (Math.acos(Math.cos(deg2rad*90.833)/(Math.cos(lat)*Math.cos(dec))-Math.tan(lat) * Math.tan(dec)))/deg2rad;
	
	return {azimuth:az,elevation:el,declination:(dec/Math.PI)*180,obl:oblqec,ec:eclong,ha:ha,HA:HA}
}

export function solar_declination(year=2022, month=12, day=22, hour=12, minute=0, sec=0){
	const twopi = 2 * Math.PI
    const deg2rad = Math.PI / 180

    const time = calc_time(year, month, day, hour, minute, sec)	
	
	let mnlong = 280.46 + 0.9856474 * time
    mnlong = mnlong % 360
	
	if(mnlong < 0)mnlong = mnlong + 360
	
	let mnanom = 357.528 + 0.9856003 * time
    mnanom = mnanom % 360
	if(mnanom < 0)mnanom = mnanom + 360
	mnanom = mnanom * deg2rad
	
	let eclong = mnlong + 1.915 * Math.sin(mnanom) + 0.02 * Math.sin(2 * mnanom)
    eclong = eclong % 360
    if(eclong < 0) eclong = eclong + 360
    let oblqec = 23.439 - 0.0000004 * time
    eclong = eclong * deg2rad
    oblqec = oblqec * deg2rad
	
	const num = Math.cos(oblqec) * Math.sin(eclong)
    const den = Math.cos(eclong)
    let ra = Math.atan(num / den)
    if(den < 0) ra = ra + Math.PI
    if(den >= 0 && num < 0) ra = ra + twopi
    const dec = Math.asin(Math.sin(oblqec) * Math.sin(eclong))
	
	return (dec/Math.PI)*180
}
