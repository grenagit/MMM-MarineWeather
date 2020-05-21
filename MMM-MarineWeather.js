/* Magic Mirror
 * Module: MMM-MarineWeather
 *
 * Magic Mirror By Michael Teeuw https://magicmirror.builders
 * MIT Licensed.
 *
 * Module MMM-MarineWeather By Grena https://github.com/grenagit
 * MIT Licensed.
 */

Module.register("MMM-MarineWeather",{

	// Default module config
	defaults: {
		latitude: 0,
		longitude: 0,
		appid: "",
		units: config.units,
		updateInterval: 60 * 60 * 1000, // every 1 hour
		animationSpeed: 1000, // 1 second
		showDirectionAsArrow: false,
		showGustAsWind: false,
		useBeaufort: false,
		useKMPH: true,
		roundTemp: false,
		
		initialLoadDelay: 0, // 0 second delay
		retryDelay: 2500, // 2,5 seconds

		apiBase: "https://api.stormglass.io/",
		MWEndpoint: "v2/weather/point",
		params: ["airTemperature", "waterTemperature", "pressure", "cloudCover", "windSpeed", "windDirection", "waveHeight", "waveDirection"],
		dataSource: "sg"
	},

	// Define required scripts
	getStyles: function() {
		return ["MMM-MarineWeather.css", "font-awesome.css"];
	},

	// Define start sequence
	start: function() {
		Log.info("Starting module: " + this.name);

		this.airTemperature = null;
		this.waterTemperature = null;
		this.temperatureUnit = null;
		this.pressure = null;
		this.pressureUnit = null;
		this.cloudCover = null;
		this.visibility = null;
		this.visibilityUnit = null;
		this.seaLevel = null;
		this.seaLevelUnit = null;
		this.windSpeed = null;
		this.windSpeedUnit = null;
		this.windDeg = null;
		this.windDirection = null;
		this.waveHeight = null;
		this.waveHeightUnit = null;
		this.waveDeg = null;
		this.waveDirection = null;
		this.wavePeriod = null;
		this.loaded = false;

		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override dom generator
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.appid === "") {
			wrapper.innerHTML = "Please set the correct Strom Glass <i>appid</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.latitude === 0 && this.config.longitude === 0) {
			wrapper.innerHTML = "Please set the weather <i>location</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var medium = document.createElement("div");
		medium.className = "normal medium";
		
		if(this.windSpeed !== null || this.windDirection !== null) {
			var windIcon = document.createElement("span");
			windIcon.className = "fas fa-wind dimmed";
			medium.appendChild(windIcon);
		}

		if(this.windSpeed !== null) {
			var windSpeed = document.createElement("span");
			windSpeed.innerHTML = " " + this.windSpeed + "<span class=\"xsmall\">" + this.windSpeedUnit + "</span>";
			medium.appendChild(windSpeed);
		}
		
		if(this.windDirection !== null) {	
			var windDirection = document.createElement("sup");
			if (this.config.showDirectionAsArrow) {
				if(this.windDeg !== null) {
					windDirection.innerHTML = " &nbsp;<i class=\"fas fa-long-arrow-alt-down\" style=\"transform:rotate(" + this.windDeg + "deg);\"></i>&nbsp;";
				}
			} else {
				windDirection.innerHTML = " " + this.translate(this.windDirection);
			}
			medium.appendChild(windDirection);
		}
		
		
		if(this.waveHeight !== null || this.waveDirection !== null || this.wavePeriod !== null) {
			var spacer = document.createElement("span");
			spacer.innerHTML = "&nbsp;";
			medium.appendChild(spacer);

			var waveIcon = document.createElement("span");
			waveIcon.className = "fas fa-water dimmed";
			medium.appendChild(waveIcon);
		}
		
		if(this.waveHeight !== null) {
			var waveHeight = document.createElement("span");
			waveHeight.innerHTML = " " + this.waveHeight + "<span class=\"xsmall\">" + this.waveHeightUnit + "</span>";
			medium.appendChild(waveHeight);
		}
		
		if(this.waveDirection !== null) {
			var waveDirection = document.createElement("sup");
			if (this.config.showDirectionAsArrow) {
				if(this.waveDeg !== null) {
					waveDirection.innerHTML = " &nbsp;<i class=\"fas fa-long-arrow-alt-down\" style=\"transform:rotate(" + this.waveDeg + "deg);\"></i>&nbsp;";
				}
			} else {
				waveDirection.innerHTML = " " + this.translate(this.waveDirection);
			}
			medium.appendChild(waveDirection);
		}

		if (this.wavePeriod !== null) {
			var wavePeriod = document.createElement("span");
			wavePeriod.innerHTML = " " + this.wavePeriod + "<span class=\"xsmall\">s</span>";
			medium.appendChild(wavePeriod);
		}
		
		if (this.seaLevel !== null) {
			var spacer = document.createElement("span");
			spacer.innerHTML = "&nbsp;";
			medium.appendChild(spacer);
			
			var rulerIcon = document.createElement("span");
			rulerIcon.className = "fas fa-ruler-vertical dimmed";
			medium.appendChild(rulerIcon);

			var seaLevel = document.createElement("span");
			seaLevel.innerHTML = " " + this.seaLevel + "<span class=\"xsmall\">" + this.seaLevelUnit + "</span>";
			medium.appendChild(seaLevel);
		}

		wrapper.appendChild(medium);

		var large = document.createElement("div");
		large.className = "large light";
		
		var waterIcon = document.createElement("span");
		waterIcon.className = "fas fa-tint watericon";
		large.appendChild(waterIcon);

		var waterTemperature = document.createElement("span");
		waterTemperature.innerHTML = " " + this.waterTemperature + this.temperatureUnit;
		large.appendChild(waterTemperature);

		wrapper.appendChild(large);

		var small = document.createElement("div");
		small.className = "dimmed small";
		
		var airIcon = document.createElement("span");
		airIcon.className = "fas fa-umbrella-beach";
		small.appendChild(airIcon);

		var airTemperature = document.createElement("span");
		airTemperature.innerHTML = " " + this.airTemperature + this.temperatureUnit;
		small.appendChild(airTemperature);
				
		if (this.pressure !== null) {
			var spacer = document.createElement("span");
			spacer.innerHTML = "&nbsp;";
			small.appendChild(spacer);
			
			var compassIcon = document.createElement("span");
			compassIcon.className = "fas fa-compass";
			small.appendChild(compassIcon);

			var pressure = document.createElement("span");
			pressure.innerHTML = " " + this.pressure + "<span class=\"xsmall\">" + this.pressureUnit + "</span>";
			small.appendChild(pressure);
		}
	
		if (this.cloudCover !== null) {
			var spacer = document.createElement("span");
			spacer.innerHTML = "&nbsp;";
			small.appendChild(spacer);
			
			var cloudIcon = document.createElement("span");
			cloudIcon.className = "fas fa-cloud";
			small.appendChild(cloudIcon);

			var cloudCover = document.createElement("span");
			cloudCover.innerHTML = " " + this.cloudCover + "%";
			small.appendChild(cloudCover);
		}

		if (this.visibility !== null) {
			var spacer = document.createElement("span");
			spacer.innerHTML = "&nbsp;";
			small.appendChild(spacer);
			
			var cloudIcon = document.createElement("span");
			cloudIcon.className = "fas fa-binoculars";
			small.appendChild(cloudIcon);

			var visibility = document.createElement("span");
			visibility.innerHTML = " " + this.visibility + "<span class=\"xsmall\">" + this.visibilityUnit + "</span>";
			small.appendChild(visibility);
		}

		wrapper.appendChild(small);

		return wrapper;
	},

	// Request new data from api.stormglass.io with node_helper
	socketNotificationReceived: function(notification, payload) {
		if (notification === "STARTED") {
			this.updateDom(this.config.animationSpeed);
		} else if (notification === "ERROR") {
			Log.error(this.name + ": Do not access to data (" + payload + " HTTP error).");
		} else if (notification === "DATA") {
			this.processMW(payload);
		}
	},

	// Use the received data to set the various values before update DOM
	processMW: function(data) {
		if (!data || !data.hours || typeof data.hours[0].time === "undefined") {
			Log.error(this.name + ": Do not receive usable data.");
			return;
		}
		
		switch(this.config.units) {
			case "metric":
				this.waterTemperature = this.roundValue(data.hours[0].waterTemperature[this.config.dataSource]);
				this.airTemperature = this.roundValue(data.hours[0].airTemperature[this.config.dataSource]);
				this.temperatureUnit = "&deg;C";
				break;
			case "imperial":
				this.waterTemperature = this.roundValue((data.hours[0].waterTemperature[this.config.dataSource] * 1.8) + 32);
				this.airTemperature = this.roundValue((data.hours[0].airTemperature[this.config.dataSource] * 1.8) + 32);
				this.temperatureUnit = "&deg;F";
				break;
		}
		
		if (this.checkData(data, "pressure")) {
			switch(this.config.units) {
				case "metric":
					this.pressure = parseFloat(data.hours[0].pressure[this.config.dataSource]).toFixed(0);
					this.pressureUnit = "hPa";
					break;
				case "imperial":
					this.pressure = parseFloat(data.hours[0].pressure[this.config.dataSource] / 6.895).toFixed(0);
					this.pressureUnit = "psi";
					break;
			}
		}
		
		if (this.checkData(data, "cloudCover")) {
			this.cloudCover = parseFloat(data.hours[0].cloudCover[this.config.dataSource]).toFixed(0);
		}
		
		if (this.checkData(data, "visibility")) {
			switch(this.config.units) {
				case "metric":
					this.visibility = parseFloat(data.hours[0].visibility[this.config.dataSource]).toFixed(1);
					this.visibilityUnit = "km";
					break;
				case "imperial":
					this.visibility = parseFloat(data.hours[0].visibility[this.config.dataSource] * 0.6214).toFixed(1);
					this.visibilityUnit = "mi";
					break;
			}
		}
		
		if (this.checkData(data, "seaLevel")) {
			switch(this.config.units) {
				case "metric":
					this.seaLevel = parseFloat(data.hours[0].seaLevel[this.config.dataSource]).toFixed(1);
					this.seaLevelUnit = "m";
					break;
				case "imperial":
					this.seaLevel = parseFloat(data.hours[0].seaLevel[this.config.dataSource] / 0.3048).toFixed(1);
					this.seaLevelUnit = "ft";
					break;
			}	
		}
		
		if (this.checkData(data, "windSpeed")) {
			if (this.config.useBeaufort){
				this.windSpeed = this.ms2Beaufort(this.roundValue(data.hours[0].windSpeed[this.config.dataSource]));
				this.windSpeedUnit = "bf";
			} else if (this.config.useKMPH) {
				this.windSpeed = parseFloat((data.hours[0].windSpeed[this.config.dataSource] * 60 * 60) / 1000).toFixed(0);
				this.windSpeedUnit = "km/h";
			} else if(this.config.units === "imperial") {
				this.windSpeed = parseFloat((data.hours[0].windSpeed[this.config.dataSource] * 60 * 60) / 1609).toFixed(0);
				this.windSpeedUnit = "mph";
			} else {
				this.windSpeed = parseFloat(data.hours[0].windSpeed[this.config.dataSource]).toFixed(0);
				this.windSpeedUnit = "m/s";
			}
		}
		
		if (this.checkData(data, "windDirection")) {
			this.windDeg = data.hours[0].windDirection[this.config.dataSource];
			this.windDirection = this.deg2Cardinal(data.hours[0].windDirection[this.config.dataSource]);
		}
		
		if (this.checkData(data, "waveHeight")) {
			switch(this.config.units) {
				case "metric":
					this.waveHeight = parseFloat(data.hours[0].waveHeight[this.config.dataSource]).toFixed(1);
					this.waveHeightUnit = "m";
					break;
				case "imperial":
					this.waveHeight = parseFloat(data.hours[0].waveHeight[this.config.dataSource] / 0.3048).toFixed(1);
					this.waveHeightUnit = "ft";
					break;
			}
		}
		
		if (this.checkData(data, "waveDirection")) {
			this.waveDeg = data.hours[0].waveDirection[this.config.dataSource];
			this.waveDirection = this.deg2Cardinal(data.hours[0].waveDirection[this.config.dataSource]);
		}

		if (this.checkData(data, "wavePeriod")) {
			this.wavePeriod = parseFloat(data.hours[0].wavePeriod[this.config.dataSource]).toFixed(1);
		}

		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
		this.scheduleUpdate();
	},

	// Schedule next update
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.sendSocketNotification('CONFIG', self.config);
		}, nextLoad);
	},

	// Converts m/s to beaufort
	ms2Beaufort: function(ms) {
		var kmh = ms * 60 * 60 / 1000;
		var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
		for (var beaufort in speeds) {
			var speed = speeds[beaufort];
			if (speed > kmh) {
				return beaufort;
			}
		}
		return 12;
	},

	// Convert degree to cardinal direction
	deg2Cardinal: function(deg) {
		if (deg>11.25 && deg<=33.75){
			return "NNE";
		} else if (deg > 33.75 && deg <= 56.25) {
			return "NE";
		} else if (deg > 56.25 && deg <= 78.75) {
			return "ENE";
		} else if (deg > 78.75 && deg <= 101.25) {
			return "E";
		} else if (deg > 101.25 && deg <= 123.75) {
			return "ESE";
		} else if (deg > 123.75 && deg <= 146.25) {
			return "SE";
		} else if (deg > 146.25 && deg <= 168.75) {
			return "SSE";
		} else if (deg > 168.75 && deg <= 191.25) {
			return "S";
		} else if (deg > 191.25 && deg <= 213.75) {
			return "SSW";
		} else if (deg > 213.75 && deg <= 236.25) {
			return "SW";
		} else if (deg > 236.25 && deg <= 258.75) {
			return "WSW";
		} else if (deg > 258.75 && deg <= 281.25) {
			return "W";
		} else if (deg > 281.25 && deg <= 303.75) {
			return "WNW";
		} else if (deg > 303.75 && deg <= 326.25) {
			return "NW";
		} else if (deg > 326.25 && deg <= 348.75) {
			return "NNW";
		} else {
			return "N";
		}
	},

	// Round a temperature to 1 decimal or integer (depending on config.roundTemp)
	roundValue: function(temperature) {
		var decimals = this.config.roundTemp ? 0 : 1;
		return parseFloat(temperature).toFixed(decimals);
	},
	
	// Check if data is usable
	checkData: function(data, param) {
		if(this.config.params.indexOf(param) !== -1) {
			if (typeof data.hours[0][param] !== "undefined") {
				return true;
			} else {
				Log.error(this.name + ": Do not receive usable data for " + param + " (this information will be hidden).");
				return false;
			}
		} else {
			return false;
		}
	}

});
