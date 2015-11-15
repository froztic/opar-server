var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var async = require('async');

mongoose.connect('mongodb://127.0.0.1:27017/opar');

var secret = "EIFJHSGUY235THGL6KN7W9L0UIHQW2R0QP5QOJ9SDLFU23GSI8U6HE4TJG8PW4OP9OY3JG6VD8BWYTD3IF0J";

var models = {
	user : require("./models/user").User,
	medrec : require("./models/medrec").MedicalRecord,
	appt : require("./models/appt").Appointment,
	dept : require("./models/dept").Department,
	schedule : require("./models/schedule").Schedule
};

var tokend;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '20mb' });

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/html/index.html');
	if(req.headers['user-agent'] == null) {
		console.log('HTTP request (home page) : ' + req.ip);
	} else {
		console.log('HTTP request (home page) : ' + req.headers['user-agent']);
	}
});

app.post('/user.login', jsonParser, function(req, res) {
	var ret = {
		success: false,
		msg: 'undefined'
	};
	res.status(200).send(ret);
});

app.post('/patient.register', jsonParser, function(req, res) {
	var ret = {
		success: false,
		msg: 'undefined'
	};
	console.log(req.body);
	ret.username = req.body.username;
	res.status(200).send(ret);
});

tokend = (function() {
	return {
		create: function (payload, callback) {
			var token = jwt.sign(payload, secret, { algorithm: 'HS256', issuer: 'opar-server' });
			callback(null, token);
		},
		verify: function (token, callback) {
			jwt.verify(token, secret, { algorithm: 'HS256', issuer: 'opar-server' }, function(err, payload) {
				if(err) {
					callback(err.name, err.message);
				} else {
					callback(null, payload);
				}
			});
		},
		decode: function (token, callback) {
			var decoded = jwt.decode(token, {complete: true});
			callback(null, decoded,payload);
		}
	}
}());

http.listen(4200, function() {
	console.log('listening on port 4200 (HTTP)');
});
