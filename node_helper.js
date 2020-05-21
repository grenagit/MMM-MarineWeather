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

	getParams: function() {
		var self = this;

		var currentDate = Math.floor(Date.now() / 1000)
		var params = "?";
		
		params += "lat=" + self.config.latitude + "&lng=" + self.config.longitude;
		params += "&params=" + self.config.params.join();
		params += "&source=" + self.config.dataSource;
		params += "&start=" + currentDate  + "&end=" + currentDate ;

		return params;
	},

	getData: function() {
		var self = this;

		fetch(self.config.apiBase + self.config.MWEndpoint + self.getParams(), {
				method: 'GET',
				headers: {'Authorization': self.config.appid}
		})
		.then(function(response) {
			if (response.status === 200) {
				return response.json();
			} else {
				self.sendSocketNotification("ERROR", response.status);
			}
		})
		.then(function(body) {
			self.sendSocketNotification("DATA", body);
		});
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if (notification === 'CONFIG') {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);
			self.getData();
		}
	}
});

