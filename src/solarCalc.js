

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
	
    const dec = Math.asin(Math.sin(oblqec) * Math.sin(eclong))
	
	return (dec/Math.PI)*180
}
