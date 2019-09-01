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
var request = require('request');
var moment = require('moment');

module.exports = NodeHelper.create({

	start: function() {
		this.started = false;
		this.configNotif = null;
	},

	getParams: function() {
		var self = this;

		//var currentDate = encodeURIComponent(moment().format());
		var currentDate = Math.floor(Date.now() / 1000)
		var params = "?";
		
		params += "lat=" + self.config.latitude + "&lng=" + self.config.longitude;
		params += "&params=" + self.config.params;
		params += "&source=" + self.config.dataSource;
		params += "&start=" + currentDate  + "&end=" + currentDate ;

		return params;
	},

	getData: function() {
		var self = this;
		
		request({
			url: self.config.apiBase + self.config.MWEndpoint + self.getParams(),
			method: 'GET',
			headers: { 'Authorization': self.config.appid },
		}, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				self.sendSocketNotification("DATA", body);
			}
		});
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if (notification === 'CONFIG' && self.started == false) {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);
			self.getData();
			self.started = true;
		}
	}
});

