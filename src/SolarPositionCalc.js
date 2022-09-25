const deg2rad = Math.PI / 180
const rad2deg = 180/Math.PI

function limit_degrees(degrees)
{
    var limited;

    degrees /= 360.0;
    limited = 360.0*(degrees-Math.floor(degrees));
    if (limited < 0) limited += 360.0;

    return limited;
}

function limit_minutes(minutes)
{
    var limited=minutes;

    if (limited < -20.0) limited += 1440.0;
    else if (limited >  20.0) limited -= 1440.0;

    return limited;
}


function limit_degrees180pm( degrees){
    var limited;

    degrees /= 360.0;
    limited = 360.0*(degrees-Math.floor(degrees));
    if      (limited < -180.0) limited += 360.0;
    else if (limited >  180.0) limited -= 360.0;

    return limited;
}

function limit_degrees180( degrees){
    var limited;

    degrees /= 180.0;
    limited = 180.0*(degrees-Math.floor(degrees));
    if (limited < 0) limited += 180.0;

    return limited;
}

function limit_zero2one(value){
    var limited;

    limited = value - Math.floor(value);
    if (limited < 0) limited += 1.0;

    return limited;
}

function dayfrac_to_local_hr(dayfrac,timezone)
{
    return 24.0*limit_zero2one(dayfrac + timezone/24.0);
}

function getJD(year,month,day,hour,minute,sec){
	var day_decimal = day + (hour + (minute + (sec)/60.0)/60.0)/24.0;
	
	if (month <= 2) {
			year -= 1;
			month += 12;
		}

	var jd = Math.floor(365.25*(year + 4716)) + Math.floor(30.6001*(month+1)) + day_decimal - 1524.5
	
	if (jd > 2299160.0) {
        var a = Math.floor(year/100);
        jd += (2 - a + Math.floor(a/4));
    }
	return jd;
}

function getJC(jd){
	var jc = (jd - 2451545.0)/36525.0;
	return jc;
}

function getJME(jc){
	return (jc/10.0);
}

function calcDateFromJD(jd){
	var z = Math.floor(jd + 0.5);
	var f = (jd + 0.5) - z;
	
	var A
	if (z < 2299161) {
		A = z;
	} else {
		var alpha = Math.floor((z - 1867216.25)/36524.25);
		A = z + 1 + alpha - Math.floor(alpha/4);
	}

	var B = A + 1524;
	var C = Math.floor((B - 122.1)/365.25);
	var D = Math.floor(365.25 * C);
	var E = Math.floor((B - D)/30.6001);

	var day = B - D - Math.floor(30.6001 * E) + f;
	var month = (E < 14) ? E - 1 : E - 13;
	var year = (month > 2) ? C - 4716 : C - 4715;
	var hour = (day - Math.floor(day))*24
	day = Math.floor(day)
	var minutes = (hour - Math.floor(hour))*60
	hour = Math.floor(hour)
	var seconds = Math.floor((minutes - Math.floor(minutes))*60)
	minutes = Math.floor(minutes)

	// alert ("date: " + day + "-" + monthList[month-1].name + "-" + year);
	return (day + "-" + month + "-" + year+" : "+hour+":"+minutes+":"+seconds);
}

function earth_periodic_term_summation(terms,jme){
    var sum=0;

    for (var i = 0; i < terms.length; i++)
        sum += terms[i][0]*Math.cos(terms[i][1]+terms[i][2]*jme);

    return sum;
}

function earth_values(terms, jme){
    var sum=0;

    for (var i = 0; i < terms.length; i++){
		
        sum += terms[i]*Math.pow(jme, i);
	}

    sum = sum / Math.pow(10, 8);

    return sum;
}

function earth_heliocentric_longitude(jme){
	var sum = [];
	for (var i = 0; i < L_TERMS.length; i++)
	sum[i] = earth_periodic_term_summation(L_TERMS[i], jme);
	
	let l = rad2deg*earth_values(sum, jme)
	if(l < 0)l += 360
	else if(l > 360)l -= 360

    return l;
}

function earth_heliocentric_latitude(jme){
	var sum = [];
	for (var i = 0; i < B_TERMS.length; i++)
	sum[i] = earth_periodic_term_summation(B_TERMS[i], jme);
	
	var l = rad2deg*earth_values(sum, jme)
	if(l < 0)l += 360
	else if(l > 360)l -= 360
	
	return l;
}

function earth_radius_vector(jme){
	var sum = [];
	for (var i = 0; i < R_TERMS.length; i++)
	sum[i] = earth_periodic_term_summation(R_TERMS[i], jme);

	return earth_values(sum, jme);
}

function geocentric_longitude(l){
    var theta = l + 180;

    if (theta >= 360) theta -= 360;

    return theta;
}

function geocentric_latitude(b){
    return -b;
}

function third_order_polynomial( a, b, c, d,x){
    return ((a*x + b)*x + c)*x + d;
}

function mean_elongation_moon_sun( jc){
    return third_order_polynomial(1.0/189474.0, -0.0019142, 445267.11148, 297.85036, jc);
}

function mean_anomaly_sun( jc){
    return third_order_polynomial(-1.0/300000.0, -0.0001603, 35999.05034, 357.52772, jc);
}

function mean_anomaly_moon( jc){
    return third_order_polynomial(1.0/56250.0, 0.0086972, 477198.867398, 134.96298, jc);
}

function argument_latitude_moon( jc){
    return third_order_polynomial(1.0/327270.0, -0.0036825, 483202.017538, 93.27191, jc);
}

function ascending_longitude_moon( jc){
    return third_order_polynomial(1.0/450000.0, 0.0020708, -1934.136261, 125.04452, jc);
}

function xy_term_summation(i,x){
	var sum = 0;
	for (var j = 0; j < x.length; j++)
		sum += x[j]*Y_TERMS[i][j];

    return sum;
}

function nutation_longitude_and_obliquity(jc,x){
	var xy_term_sum, sum_psi=0, sum_epsilon=0;

    for (var i = 0; i < Y_TERMS.length; i++) {
        xy_term_sum  = deg2rad*xy_term_summation(i, x);
        sum_psi     += (PE_TERMS[i][0] + jc*PE_TERMS[i][1])*Math.sin(xy_term_sum);
        sum_epsilon += (PE_TERMS[i][2] + jc*PE_TERMS[i][3])*Math.cos(xy_term_sum);
    }

    return {lon:sum_psi / 36000000.0,obl:sum_epsilon / 36000000.0};
}

function ecliptic_mean_obliquity(jme){
	var u = jme/10.0;

    return 84381.448 + u*(-4680.93 + u*(-1.55 + u*(1999.25 + u*(-51.38 + u*(-249.67 + u*(  -39.05 + u*( 7.12 + u*(  27.87 + u*(  5.79 + u*2.45)))))))));
}

function ecliptic_true_obliquity(delta_epsilon, epsilon0){
    return delta_epsilon + epsilon0/3600.0;
}

function aberration_correction( r){
    return -20.4898 / (3600.0*r);
}

function apparent_sun_longitude(theta,delta_psi,delta_tau){
    return theta + delta_psi + delta_tau;
}

function greenwich_mean_sidereal_time (jd,jc){
	let gs = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + jc*jc*(0.000387933 - jc/38710000.0)
	if(gs < 0)gs += 360
	else if(gs > 360)gs -= 360
	
    return gs;
}

function greenwich_sidereal_time (nu0,delta_psi,epsilon){
    return nu0 + delta_psi*Math.cos(deg2rad*epsilon);
}

function geocentric_right_ascension(lamda, epsilon, beta){
    var lamda_rad   = deg2rad*lamda;
    var epsilon_rad = deg2rad*epsilon;
	
	var a = rad2deg*Math.atan2(Math.sin(lamda_rad)*Math.cos(epsilon_rad) -
                                       Math.tan(deg2rad*beta)*Math.sin(epsilon_rad), Math.cos(lamda_rad))
	if(a < 0)a += 360
	else if(a > 360)a -= 360

    return a;
}

function geocentric_declination( beta, epsilon, lamda){
    var beta_rad    = deg2rad*beta;
    var epsilon_rad = deg2rad*epsilon;

    return rad2deg*Math.asin(Math.sin(beta_rad)*Math.cos(epsilon_rad) +
                        Math.cos(beta_rad)*Math.sin(epsilon_rad)*Math.sin(deg2rad*lamda));
}

function observer_hour_angle( nu, longitude, alpha_deg){
	
	var h = nu + longitude - alpha_deg
	
	if(h < 0)h += 360
	else if(h > 360)h -= 360
	
    return h;
}

function sun_equatorial_horizontal_parallax( r){
    return 8.794 / (3600.0 * r);
}

function right_ascension_parallax_and_topocentric_dec( latitude, xi, h, delta){
    var delta_alpha_rad;
    var lat_rad   = deg2rad*latitude;
    var xi_rad    = deg2rad*xi;
    var h_rad     = deg2rad*h;
    var delta_rad = deg2rad*delta;
    var u = Math.atan(0.99664719 * Math.tan(lat_rad));
    var y = 0.99664719 * Math.sin(u) + 840*Math.sin(lat_rad)/6378140.0;
    var x =              Math.cos(u) + 840*Math.cos(lat_rad)/6378140.0;

    delta_alpha_rad = Math.atan2(- x*Math.sin(xi_rad) *Math.sin(h_rad),
                                  Math.cos(delta_rad) - x*Math.sin(xi_rad) *Math.cos(h_rad));

    var delta_prime = rad2deg*Math.atan2((Math.sin(delta_rad) - y*Math.sin(xi_rad))*Math.cos(delta_alpha_rad),
                                  Math.cos(delta_rad) - x*Math.sin(xi_rad) *Math.cos(h_rad));

    var delta_alpha = rad2deg*delta_alpha_rad;
	
	return {delta_prime:delta_prime,delta_alpha:delta_alpha}
}

function topocentric_right_ascension(alpha_deg, delta_alpha){
    return alpha_deg + delta_alpha;
}

function topocentric_local_hour_angle( h, delta_alpha){
    return h - delta_alpha;
}

function topocentric_elevation_angle( latitude, delta_prime, h_prime){
    var lat_rad         = deg2rad*latitude;
    var delta_prime_rad = deg2rad*delta_prime;

    return rad2deg*Math.asin(Math.sin(lat_rad)*Math.sin(delta_prime_rad) +
                        Math.cos(lat_rad)*Math.cos(delta_prime_rad) * Math.cos(deg2rad*h_prime));
}

function topocentric_azimuth_angle( h_prime, latitude, delta_prime)
{
    var h_prime_rad = deg2rad*h_prime;
    var lat_rad     = deg2rad*latitude;
	
	var az = rad2deg*Math.atan2(Math.sin(h_prime_rad),
                         Math.cos(h_prime_rad)*Math.sin(lat_rad) - Math.tan(deg2rad*delta_prime)*Math.cos(lat_rad))
						 
	if(az < 0)az += 360
	else if(az > 360)az -= 360
	
	az = az + 180
	
	if(az < 0)az += 360
	else if(az > 360)az -= 360

    return az;
}

function sun_mean_longitude(jme){
	var m = 280.4664567 + jme*(360007.6982779 + jme*(0.03032028 +
                    jme*(1/49931.0   + jme*(-1/15300.0     + jme*(-1/2000000.0)))))
	if(m < 0)m += 360
	else if(m > 360)m -= 360
	
    return limit_degrees(m);
}

function eot( m, alpha, del_psi, epsilon){
    return limit_minutes(4.0*(m - 0.0057183 - alpha + del_psi*Math.cos(deg2rad*epsilon)));
}

function approx_sun_transit_time(alpha_zero,longitude, nu)
{
    return (alpha_zero - longitude - nu) / 360.0;
}

function sun_hour_angle_at_rise_set(latitude,delta_zero,h0_prime)
{
    var h0             = -99999;
    var latitude_rad   = deg2rad*latitude;
    var delta_zero_rad = deg2rad*delta_zero;
    var argument       = (Math.sin(deg2rad*h0_prime) - Math.sin(latitude_rad)*Math.sin(delta_zero_rad)) /
                                                     (Math.cos(latitude_rad)*Math.cos(delta_zero_rad));

    if (Math.abs(argument) <= 1) h0 = limit_degrees180(rad2deg*Math.acos(argument));
    return h0;
}

function approx_sun_rise_and_set(m,h0){
	var m_rts = []
    var h0_dfrac = h0/360.0;

    m_rts[1]    = limit_zero2one(m - h0_dfrac);
    m_rts[2]     = limit_zero2one(m + h0_dfrac);
    m_rts[0] = limit_zero2one(m);
	return m_rts
}

function rts_alpha_delta_prime(ad, n)
{
    var a = ad[1] - ad[2];
    var b = ad[0] - ad[1];

    if (Math.abs(a) >= 2.0) a = limit_zero2one(a);
    if (Math.abs(b) >= 2.0) b = limit_zero2one(b);

    return ad[1] + n * (a + b + (b-a)*n)/2.0;
}

function rts_sun_altitude(latitude,delta_prime, h_prime)
{
    var latitude_rad    = deg2rad*latitude;
    var delta_prime_rad = deg2rad*delta_prime;

    return rad2deg*Math.asin(Math.sin(latitude_rad)*Math.sin(delta_prime_rad) +
                        Math.cos(latitude_rad)*Math.cos(delta_prime_rad)*Math.cos(deg2rad*h_prime));
}

function sun_rise_and_set(m_rts,h_rts,delta_prime,latitude,h_prime,h0_prime,sun)
{
    return m_rts[sun] + (h_rts[sun] - h0_prime) /
          (360.0*Math.cos(deg2rad*delta_prime[sun])*Math.cos(deg2rad*latitude)*Math.sin(deg2rad*h_prime[sun]));
}



export function getResults(lat,lon,year,month,day,hour,minute,sec){
	var jd = getJD(year,month,day,hour,minute,sec)
	var jc = getJC(jd)
	var jme = getJME(jc)
	
	var x =  [mean_elongation_moon_sun(jc),mean_anomaly_sun( jc),mean_anomaly_moon( jc),argument_latitude_moon( jc),ascending_longitude_moon( jc)];
	
	var v = greenwich_mean_sidereal_time (jd,jc)
	var l = earth_heliocentric_longitude(jme)
	var b = earth_heliocentric_latitude(jme)
	var beta = geocentric_latitude(b)
	var delta_epsilon = nutation_longitude_and_obliquity(jc,x).obl
	var epsilon0 = ecliptic_mean_obliquity(jme)
	var epsilon = ecliptic_true_obliquity(delta_epsilon, epsilon0)
	var r = earth_radius_vector(jme)
	var delta_tau = aberration_correction(r)
	var delta_p = nutation_longitude_and_obliquity(jc,x).lon
	var theta = geocentric_longitude(l)
	var lamda = apparent_sun_longitude(theta,delta_p,delta_tau)
	var delta_dec = geocentric_declination( beta, epsilon, lamda)
	var a = geocentric_right_ascension(lamda, epsilon,beta)
	var H = observer_hour_angle(v, lon, a)
	var xi = sun_equatorial_horizontal_parallax( r)
	var delta_alpha = right_ascension_parallax_and_topocentric_dec(lat,xi,H,delta_dec).delta_alpha
	var delta_a = right_ascension_parallax_and_topocentric_dec(lat,xi,H,delta_dec).delta_prime
	var h_prime = topocentric_local_hour_angle(H,delta_alpha)
	
	var el = topocentric_elevation_angle( lat, delta_a, h_prime)
	var az = topocentric_azimuth_angle(h_prime,lat,delta_a)
	
	var nu = greenwich_sidereal_time(v,delta_p,epsilon)
	var m = sun_mean_longitude(jme)
	var eqtime = eot(m,a,delta_p,epsilon)
	
	return {el: el, az: az,dec:delta_dec,date:calcDateFromJD(jd),eot:eqtime}
}

function calcWithJD(jd){
    var x= []
	var spa = {}
	spa.jd = jd
    spa.jc = getJC(spa.jd);

    spa.jde = spa.jd;
    spa.jce = spa.jc;
    spa.jme = getJME(spa.jce);

    spa.l = earth_heliocentric_longitude(spa.jme);
    spa.b = earth_heliocentric_latitude(spa.jme);
    spa.r = earth_radius_vector(spa.jme);

    spa.theta = geocentric_longitude(spa.l);
    spa.beta  = geocentric_latitude(spa.b);

    x[0] = spa.x0 = mean_elongation_moon_sun(spa.jce);
    x[1] = spa.x1 = mean_anomaly_sun(spa.jce);
    x[2] = spa.x2 = mean_anomaly_moon(spa.jce);
    x[3] = spa.x3 = argument_latitude_moon(spa.jce);
    x[4] = spa.x4 = ascending_longitude_moon(spa.jce);

    spa.del_psi = nutation_longitude_and_obliquity(spa.jce,x).lon
	spa.del_epsilon = nutation_longitude_and_obliquity(spa.jce,x).obl

    spa.epsilon0 = ecliptic_mean_obliquity(spa.jme);
    spa.epsilon  = ecliptic_true_obliquity(spa.del_epsilon, spa.epsilon0);

    spa.del_tau   = aberration_correction(spa.r);
    spa.lamda     = apparent_sun_longitude(spa.theta, spa.del_psi, spa.del_tau);
    spa.nu0       = greenwich_mean_sidereal_time (spa.jd, spa.jc);
    spa.nu        = greenwich_sidereal_time (spa.nu0, spa.del_psi, spa.epsilon);

    spa.alpha = geocentric_right_ascension(spa.lamda, spa.epsilon, spa.beta);
    spa.delta = geocentric_declination(spa.beta, spa.epsilon, spa.lamda);
	
	return spa
}

function calc(lat,lon,year,month,day,hour,minute,sec){
    var x= []
	var spa = {}
	
	spa.year = year
	spa.month = month
	spa.day = day
	spa.hour = hour
	spa.minute = minute
	spa.sec = sec
	spa.latitude = lat
	spa.longitude = lon
	spa.jd = getJD(year,month,day,hour,minute,sec)
    spa.jc = getJC(spa.jd);

    spa.jde = spa.jd;
    spa.jce = spa.jc;
    spa.jme = getJME(spa.jce);

    spa.l = earth_heliocentric_longitude(spa.jme);
    spa.b = earth_heliocentric_latitude(spa.jme);
    spa.r = earth_radius_vector(spa.jme);

    spa.theta = geocentric_longitude(spa.l);
    spa.beta  = geocentric_latitude(spa.b);

    x[0] = spa.x0 = mean_elongation_moon_sun(spa.jce);
    x[1] = spa.x1 = mean_anomaly_sun(spa.jce);
    x[2] = spa.x2 = mean_anomaly_moon(spa.jce);
    x[3] = spa.x3 = argument_latitude_moon(spa.jce);
    x[4] = spa.x4 = ascending_longitude_moon(spa.jce);

    spa.del_psi = nutation_longitude_and_obliquity(spa.jce,x).lon
	spa.del_epsilon = nutation_longitude_and_obliquity(spa.jce,x).obl

    spa.epsilon0 = ecliptic_mean_obliquity(spa.jme);
    spa.epsilon  = ecliptic_true_obliquity(spa.del_epsilon, spa.epsilon0);

    spa.del_tau   = aberration_correction(spa.r);
    spa.lamda     = apparent_sun_longitude(spa.theta, spa.del_psi, spa.del_tau);
    spa.nu0       = greenwich_mean_sidereal_time (spa.jd, spa.jc);
    spa.nu        = greenwich_sidereal_time (spa.nu0, spa.del_psi, spa.epsilon);

    spa.alpha = geocentric_right_ascension(spa.lamda, spa.epsilon, spa.beta);
    spa.delta = geocentric_declination(spa.beta, spa.epsilon, spa.lamda);
	
	spa.H = observer_hour_angle(spa.nu0, spa.longitude, spa.alpha)
	spa.xi = sun_equatorial_horizontal_parallax(spa.r)
	spa.delta_alpha = right_ascension_parallax_and_topocentric_dec(spa.latitude,spa.xi,spa.H,spa.delta).delta_alpha
	spa.delta_a = right_ascension_parallax_and_topocentric_dec(spa.latitude,spa.xi,spa.H,spa.delta).delta_prime
	spa.h_prime = topocentric_local_hour_angle(spa.H,spa.delta_alpha)
	
	spa.el = topocentric_elevation_angle(spa.latitude, spa.delta_a, spa.h_prime)
	spa.az = topocentric_azimuth_angle(spa.h_prime,spa.latitude,spa.delta_a)
	
	spa.m = sun_mean_longitude(spa.jme)
	spa.eqtime = eot(spa.m,spa.alpha,spa.del_psi,spa.epsilon)
	
	return spa
}

function calculate_eot_and_sun_rise_transit_set(spa){
    var sun_rts;
    var nu, m, h0, n;
    var alpha = [], delta = [];
    var m_rts = [], nu_rts = [], h_rts= [];
    var alpha_prime = [], delta_prime =[], h_prime= [];
    var h0_prime = -1*(0.2667);
    var i;

	sun_rts  = spa;
    m        = sun_mean_longitude(spa.jme);
    spa.eot = eot(m, spa.alpha, spa.del_psi, spa.epsilon);

    sun_rts = {...sun_rts,...calcWithJD(spa.jd)};
    nu = sun_rts.nu;

    sun_rts.delta_t = 0;
    sun_rts.jd = sun_rts.jd - 1;
    for (var i = 0; i < 3; i++) {
        sun_rts = {...sun_rts,...calcWithJD(sun_rts.jd)};
        alpha[i] = sun_rts.alpha;
        delta[i] = sun_rts.delta;
        sun_rts.jd = sun_rts.jd + 1;
    }
    m_rts[0] = approx_sun_transit_time(alpha[0], spa.longitude, nu);
    h0 = sun_hour_angle_at_rise_set(spa.latitude, delta[0], h0_prime);

    if (h0 >= 0) {

        m_rts = approx_sun_rise_and_set(m_rts[0],h0);
		
        for (i = 0; i < 3; i++) {

            nu_rts[i]      = nu + 360.985647*m_rts[i];
			
            n              = m_rts[i];
            alpha_prime[i] = rts_alpha_delta_prime(alpha, n);
            delta_prime[i] = rts_alpha_delta_prime(delta, n);

            h_prime[i]     = limit_degrees180pm(nu_rts[i] + spa.longitude - alpha_prime[i]);

            h_rts[i]       = rts_sun_altitude(spa.latitude, delta_prime[i], h_prime[i]);
        }

        spa.srha = h_prime[1];
        spa.ssha = h_prime[2];
        spa.sta  = h_rts[0];

        spa.suntransit = dayfrac_to_local_hr(m_rts[0] - h_prime[0] / 360.0,
                                              0);

        spa.sunrise = dayfrac_to_local_hr(sun_rise_and_set(m_rts, h_rts, delta_prime,
                          spa.latitude, h_prime, h0_prime, 1), 0);
        spa.sunset  = dayfrac_to_local_hr(sun_rise_and_set(m_rts, h_rts, delta_prime,
                          spa.latitude, h_prime, h0_prime, 2),  0);

    } else spa.srha= spa.ssha= spa.sta= spa.suntransit= spa.sunrise= spa.sunset= -99999;
		return {sunrise:spa.sunrise,sunset:spa.sunset,transit:spa.suntransit}
}

export function result(lat,lon,year,month,day,hour,minute,sec){
	var results = calc(lat,lon,year,month,day,hour,minute,sec)
	var daylight = calculate_eot_and_sun_rise_transit_set(calc(lat,lon,year,month,day,0,0,0))
	return {lat:results.latitude,lon:results.longitude,el: results.el,az:results.az,dec:results.delta,eot:results.eqtime,...daylight}
}


var L_TERMS=[
    [
        [175347046.0,0,0],
        [3341656.0,4.6692568,6283.07585],
        [34894.0,4.6261,12566.1517],
        [3497.0,2.7441,5753.3849],
        [3418.0,2.8289,3.5231],
        [3136.0,3.6277,77713.7715],
        [2676.0,4.4181,7860.4194],
        [2343.0,6.1352,3930.2097],
        [1324.0,0.7425,11506.7698],
        [1273.0,2.0371,529.691],
        [1199.0,1.1096,1577.3435],
        [990,5.233,5884.927],
        [902,2.045,26.298],
        [857,3.508,398.149],
        [780,1.179,5223.694],
        [753,2.533,5507.553],
        [505,4.583,18849.228],
        [492,4.205,775.523],
        [357,2.92,0.067],
        [317,5.849,11790.629],
        [284,1.899,796.298],
        [271,0.315,10977.079],
        [243,0.345,5486.778],
        [206,4.806,2544.314],
        [205,1.869,5573.143],
        [202,2.458,6069.777],
        [156,0.833,213.299],
        [132,3.411,2942.463],
        [126,1.083,20.775],
        [115,0.645,0.98],
        [103,0.636,4694.003],
        [102,0.976,15720.839],
        [102,4.267,7.114],
        [99,6.21,2146.17],
        [98,0.68,155.42],
        [86,5.98,161000.69],
        [85,1.3,6275.96],
        [85,3.67,71430.7],
        [80,1.81,17260.15],
        [79,3.04,12036.46],
        [75,1.76,5088.63],
        [74,3.5,3154.69],
        [74,4.68,801.82],
        [70,0.83,9437.76],
        [62,3.98,8827.39],
        [61,1.82,7084.9],
        [57,2.78,6286.6],
        [56,4.39,14143.5],
        [56,3.47,6279.55],
        [52,0.19,12139.55],
        [52,1.33,1748.02],
        [51,0.28,5856.48],
        [49,0.49,1194.45],
        [41,5.37,8429.24],
        [41,2.4,19651.05],
        [39,6.17,10447.39],
        [37,6.04,10213.29],
        [37,2.57,1059.38],
        [36,1.71,2352.87],
        [36,1.78,6812.77],
        [33,0.59,17789.85],
        [30,0.44,83996.85],
        [30,2.74,1349.87],
        [25,3.16,4690.48]
    ],
    [
        [628331966747.0,0,0],
        [206059.0,2.678235,6283.07585],
        [4303.0,2.6351,12566.1517],
        [425.0,1.59,3.523],
        [119.0,5.796,26.298],
        [109.0,2.966,1577.344],
        [93,2.59,18849.23],
        [72,1.14,529.69],
        [68,1.87,398.15],
        [67,4.41,5507.55],
        [59,2.89,5223.69],
        [56,2.17,155.42],
        [45,0.4,796.3],
        [36,0.47,775.52],
        [29,2.65,7.11],
        [21,5.34,0.98],
        [19,1.85,5486.78],
        [19,4.97,213.3],
        [17,2.99,6275.96],
        [16,0.03,2544.31],
        [16,1.43,2146.17],
        [15,1.21,10977.08],
        [12,2.83,1748.02],
        [12,3.26,5088.63],
        [12,5.27,1194.45],
        [12,2.08,4694],
        [11,0.77,553.57],
        [10,1.3,6286.6],
        [10,4.24,1349.87],
        [9,2.7,242.73],
        [9,5.64,951.72],
        [8,5.3,2352.87],
        [6,2.65,9437.76],
        [6,4.67,4690.48]
    ],
    [
        [52919.0,0,0],
        [8720.0,1.0721,6283.0758],
        [309.0,0.867,12566.152],
        [27,0.05,3.52],
        [16,5.19,26.3],
        [16,3.68,155.42],
        [10,0.76,18849.23],
        [9,2.06,77713.77],
        [7,0.83,775.52],
        [5,4.66,1577.34],
        [4,1.03,7.11],
        [4,3.44,5573.14],
        [3,5.14,796.3],
        [3,6.05,5507.55],
        [3,1.19,242.73],
        [3,6.12,529.69],
        [3,0.31,398.15],
        [3,2.28,553.57],
        [2,4.38,5223.69],
        [2,3.75,0.98]
    ],
    [
        [289.0,5.844,6283.076],
        [35,0,0],
        [17,5.49,12566.15],
        [3,5.2,155.42],
        [1,4.72,3.52],
        [1,5.3,18849.23],
        [1,5.97,242.73]
    ],
    [
        [114.0,3.142,0],
        [8,4.13,6283.08],
        [1,3.84,12566.15]
    ],
    [
        [1,3.14,0]
    ]
];

var B_TERMS=[
    [
        [280.0,3.199,84334.662],
        [102.0,5.422,5507.553],
        [80,3.88,5223.69],
        [44,3.7,2352.87],
        [32,4,1577.34]
    ],
    [
        [9,3.9,5507.55],
        [6,1.73,5223.69]
    ]
];

var R_TERMS=[
    [
        [100013989.0,0,0],
        [1670700.0,3.0984635,6283.07585],
        [13956.0,3.05525,12566.1517],
        [3084.0,5.1985,77713.7715],
        [1628.0,1.1739,5753.3849],
        [1576.0,2.8469,7860.4194],
        [925.0,5.453,11506.77],
        [542.0,4.564,3930.21],
        [472.0,3.661,5884.927],
        [346.0,0.964,5507.553],
        [329.0,5.9,5223.694],
        [307.0,0.299,5573.143],
        [243.0,4.273,11790.629],
        [212.0,5.847,1577.344],
        [186.0,5.022,10977.079],
        [175.0,3.012,18849.228],
        [110.0,5.055,5486.778],
        [98,0.89,6069.78],
        [86,5.69,15720.84],
        [86,1.27,161000.69],
        [65,0.27,17260.15],
        [63,0.92,529.69],
        [57,2.01,83996.85],
        [56,5.24,71430.7],
        [49,3.25,2544.31],
        [47,2.58,775.52],
        [45,5.54,9437.76],
        [43,6.01,6275.96],
        [39,5.36,4694],
        [38,2.39,8827.39],
        [37,0.83,19651.05],
        [37,4.9,12139.55],
        [36,1.67,12036.46],
        [35,1.84,2942.46],
        [33,0.24,7084.9],
        [32,0.18,5088.63],
        [32,1.78,398.15],
        [28,1.21,6286.6],
        [28,1.9,6279.55],
        [26,4.59,10447.39]
    ],
    [
        [103019.0,1.10749,6283.07585],
        [1721.0,1.0644,12566.1517],
        [702.0,3.142,0],
        [32,1.02,18849.23],
        [31,2.84,5507.55],
        [25,1.32,5223.69],
        [18,1.42,1577.34],
        [10,5.91,10977.08],
        [9,1.42,6275.96],
        [9,0.27,5486.78]
    ],
    [
        [4359.0,5.7846,6283.0758],
        [124.0,5.579,12566.152],
        [12,3.14,0],
        [9,3.63,77713.77],
        [6,1.87,5573.14],
        [3,5.47,18849.23]
    ],
    [
        [145.0,4.273,6283.076],
        [7,3.92,12566.15]
    ],
    [
        [4,2.56,6283.08]
    ]
];

var Y_TERMS=[
    [0,0,0,0,1],
    [-2,0,0,2,2],
    [0,0,0,2,2],
    [0,0,0,0,2],
    [0,1,0,0,0],
    [0,0,1,0,0],
    [-2,1,0,2,2],
    [0,0,0,2,1],
    [0,0,1,2,2],
    [-2,-1,0,2,2],
    [-2,0,1,0,0],
    [-2,0,0,2,1],
    [0,0,-1,2,2],
    [2,0,0,0,0],
    [0,0,1,0,1],
    [2,0,-1,2,2],
    [0,0,-1,0,1],
    [0,0,1,2,1],
    [-2,0,2,0,0],
    [0,0,-2,2,1],
    [2,0,0,2,2],
    [0,0,2,2,2],
    [0,0,2,0,0],
    [-2,0,1,2,2],
    [0,0,0,2,0],
    [-2,0,0,2,0],
    [0,0,-1,2,1],
    [0,2,0,0,0],
    [2,0,-1,0,1],
    [-2,2,0,2,2],
    [0,1,0,0,1],
    [-2,0,1,0,1],
    [0,-1,0,0,1],
    [0,0,2,-2,0],
    [2,0,-1,2,1],
    [2,0,1,2,2],
    [0,1,0,2,2],
    [-2,1,1,0,0],
    [0,-1,0,2,2],
    [2,0,0,2,1],
    [2,0,1,0,0],
    [-2,0,2,2,2],
    [-2,0,1,2,1],
    [2,0,-2,0,1],
    [2,0,0,0,1],
    [0,-1,1,0,0],
    [-2,-1,0,2,1],
    [-2,0,0,0,1],
    [0,0,2,2,1],
    [-2,0,2,0,1],
    [-2,1,0,2,1],
    [0,0,1,-2,0],
    [-1,0,1,0,0],
    [-2,1,0,0,0],
    [1,0,0,0,0],
    [0,0,1,2,0],
    [0,0,-2,2,2],
    [-1,-1,1,0,0],
    [0,1,1,0,0],
    [0,-1,1,2,2],
    [2,-1,-1,2,2],
    [0,0,3,2,2],
    [2,-1,0,2,2],
];

var PE_TERMS=[
    [-171996,-174.2,92025,8.9],
    [-13187,-1.6,5736,-3.1],
    [-2274,-0.2,977,-0.5],
    [2062,0.2,-895,0.5],
    [1426,-3.4,54,-0.1],
    [712,0.1,-7,0],
    [-517,1.2,224,-0.6],
    [-386,-0.4,200,0],
    [-301,0,129,-0.1],
    [217,-0.5,-95,0.3],
    [-158,0,0,0],
    [129,0.1,-70,0],
    [123,0,-53,0],
    [63,0,0,0],
    [63,0.1,-33,0],
    [-59,0,26,0],
    [-58,-0.1,32,0],
    [-51,0,27,0],
    [48,0,0,0],
    [46,0,-24,0],
    [-38,0,16,0],
    [-31,0,13,0],
    [29,0,0,0],
    [29,0,-12,0],
    [26,0,0,0],
    [-22,0,0,0],
    [21,0,-10,0],
    [17,-0.1,0,0],
    [16,0,-8,0],
    [-16,0.1,7,0],
    [-15,0,9,0],
    [-13,0,7,0],
    [-12,0,6,0],
    [11,0,0,0],
    [-10,0,5,0],
    [-8,0,3,0],
    [7,0,-3,0],
    [-7,0,0,0],
    [-7,0,3,0],
    [-7,0,3,0],
    [6,0,0,0],
    [6,0,-3,0],
    [6,0,-3,0],
    [-6,0,3,0],
    [-6,0,3,0],
    [5,0,0,0],
    [-5,0,3,0],
    [-5,0,3,0],
    [-5,0,3,0],
    [4,0,0,0],
    [4,0,0,0],
    [4,0,0,0],
    [-4,0,0,0],
    [-4,0,0,0],
    [-4,0,0,0],
    [3,0,0,0],
    [-3,0,0,0],
    [-3,0,0,0],
    [-3,0,0,0],
    [-3,0,0,0],
    [-3,0,0,0],
    [-3,0,0,0],
    [-3,0,0,0],
];