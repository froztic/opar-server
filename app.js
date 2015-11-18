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
	patient : require("./models/user").Patient,
	doctor : require("./models/user").Doctor,
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

app.get('/patient.getinfo', function(req, res) {
	if(req.query._token) {
		var ret = {
			success : false,
			msg : 'undefined'
		};
		logind.is_login(req.query._token, function(error, token) {
			if(error) {
				ret.success = false;
				ret.msg = 'token error';
				res.status(200).send(ret);
			} else {
				models.patient.getinfo(req.query, token, function(err, msg) {
					if(err) {
						ret.success = false;	
						ret.msg = msg;
					} else {
						ret.success = true;
						ret.msg = 'success';
						ret.patient_obj = msg;
					}
					res.status(200).send(ret);
				});
			}
		});
	} else {
		res.status(404).sendFile(__dirname + '/html/404.html');
	}
});

app.get(/.*.getlist$/, function(req, res, next) {
	if(req.query._token) {
		next();
	} else {
		res.status(404).sendFile(__dirname + '/html/404.html');
	}
});

app.get('/patient.getlist', function(req, res) {
});

app.get('/doctor.getlist', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	
});

app.get('/*', function(req, res) {
	res.status(404).sendFile(__dirname + '/html/404.html');
});

app.post('/user.login', jsonParser, function(req, res) {
	var ret = {
		success: false,
		msg: 'undefined'
	};
	console.log('user : '+ req.body.username + ' is logging in');
	models.user.login(req.body, function(err, msg) {
		if(err) {
			ret.success = false;
			ret.msg = msg;
			res.status(200).send(ret);
		} else {
			ret.success = true;
			ret.msg = 'success';
			ret.userObj = msg;
			tokend.create(ret.userObj, function (error, token) {
				if(error) {
					console.error('failed to create token');
				} else {
					ret._token = token;
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/user.recover', jsonParser, function(req, res) {
	var ret = {
		success: false,
		msg: 'undefined'
	};
	models.user.recover(req.body, function(err, msg) {
		ret.success = err? false:true;
		ret.msg = msg;
		res.status(200).send(ret);
	});
});

app.post('/user.changepass', jsonParser, function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login(req.body._token, function(err, payload) {
		if(err) {
			ret.succss = false;
			ret.msg = 'token error';
			res.status(200).send(ret);
		} else {
			models.user.changepass( req.body, payload, function(err2, msg) {
				if(err2) {
					ret.success = false;
					ret.msg = msg;
				} else {
					ret.success = true;
					ret.msg = 'success';
					console.log(msg.username + ' password changed');
				}
				res.status(200).send(ret)
			});
		}
	});
});

app.post('/patient.register', jsonParser, function(req, res) {
	var ret = {
		success: false,
		msg: 'undefined'
	};
	models.patient.register(req.body, function(err, msg) {
		if(err) {
			ret.success = false;
		} else {
			ret.success = true;
		}
		ret.msg = msg;
		res.status(200).send(ret);
	});
});

app.post('/patient.editinfo', jsonParser, function(req, res) {
	var ret = {
		success: false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 5, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = 'token error';
			res.status(200).send(ret);
		} else {
		}
	});
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

logind = (function() {
	return {
		is_login: function (token, callback) {
			tokend.verify(token, function(err, res) {
				if(err) {
					callback(err, res);
				} else {
					callback(null, res);
				}
			});
		},
		is_login_priv: function (token, priv, callback) {
			
		}
	}
}());

http.listen(4200, function() {
	console.log('listening on port 4200 (HTTP)');
});
