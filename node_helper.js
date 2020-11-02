'use strict';

/* Magic Mirror
 * Module: MMM-MarineWeather
 *
 * Magic Mirror By Michael Teeuw https://magicmirror.builders
 * MIT Licensed.
 *
 * Module MMM-MarineWeather By Grena https://github.com/grenagit
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const fetch = require('node-fetch');

module.exports = NodeHelper.create({

	getUrl: function(type) {
		var self = this;
		
		var currentTime = Math.floor(Date.now() / 1000);
		
		var params = "?";
		var url = self.config.apiBase;
		
		params += "lat=" + self.config.latitude + "&lng=" + self.config.longitude;
		
		switch(type) {
			case "weather":
				params += "&start=" + currentTime  + "&end=" + currentTime;
				params += "&params=" + self.config.params.join();
				params += "&source=" + self.config.dataSource;
				
				url += self.config.weatherEndpoint;
				url += params;
				break;
				
			case "tide":
				params += "&start=" + currentTime;
				
				url += self.config.tideEndpoint;
				url += params;
				break;
		}

		return url;
	},
	
	getData: function(apis) {
		var self = this;
		
		var options = {
			method: 'GET',
			headers: {'Authorization': self.config.appid}
		};
		
		Promise.all(apis.map(function(api) {
			return fetch(self.getUrl(api), options);
		}))
		.then(function(responses) {
			return Promise.all(responses.map(function(response) {
				if (response.status === 200) {
					return response.json();
				} else {
					self.sendSocketNotification("ERROR", response.status);
				}
			}));
		})
		.then(function(result) {
			if(self.config.showTides) {
				self.sendSocketNotification("DATA", {"weather": result[0].hours[0], "tide": result[1].data});
			} else {
				self.sendSocketNotification("DATA", {"weather": result[0].hours[0]});
			}
		});
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		
		if (notification === "CONFIG") {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);	
			if(self.config.showTides) {
				self.getData(["weather", "tide"]);
			} else {
				self.getData(["weather"]);
			}
		}
	}
});

