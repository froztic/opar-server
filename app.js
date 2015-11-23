var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var async = require('async');
var cors = require('cors');

mongoose.connect('mongodb://127.0.0.1:27017/opar');

var secret = "EIFJHSGUY235THGL6KN7W9L0UIHQW2R0QP5QOJ9SDLFU23GSI8U6HE4TJG8PW4OP9OY3JG6VD8BWYTD3IF0J";

var models = {
	user : require("./models/user").User,
	patient : require("./models/user").Patient,
	doctor : require("./models/user").Doctor,
	officer : require("./models/user").Officer,
	medrec : require("./models/medrec").MedicalRecord,
	appt : require("./models/appt").Appointment,
	dept : require("./models/dept").Department,
	schedule : require("./models/schedule").Schedule
};

var tokend;


//var parser = bodyParser.json();
var parser = bodyParser.urlencoded({ extended: true, limit: '20mb' });

app.use(parser);
app.use(cors({
	origin : "*",
//	origin : "http://opar.froztic.in.th",
	methods : "GET,POST"
}));

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
	if(req.query._token || req.path === '/dept.getlist') {
		next();
	} else {
		res.status(404).sendFile(__dirname + '/html/404.html');
	}
});

app.get('/patient.getlist', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.query._token, 30, function(error, token) {
		if(error) {
			console.error(error)
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log('get patient list');
			models.patient.getlist(req.query, function(err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
					ret.msg = msg;
				} else { 
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
					ret.patient_list = msg;
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.get('/doctor.getlist', function(req, res) {
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
			console.log('retreiving doctor list');
			models.doctor.getlist(req.query, token, function(err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
					ret.msg = msg;
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
					ret.doctor_list = msg;
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.get('/dept.getlist', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
//	logind.is_login(req.query._token, function(error, token) {
//		if(error) {
//			ret.success = false;
//			ret.msg = 'token error';
//			res.status(200).send(ret);
//		} else {
			models.dept.getlist(function(err, msg) {
				if(err) {
					ret.success = false;
					ret.msg = msg;
				} else {
					ret.success = true;
					ret.msg = 'success';
					ret.dept_list = msg;
				}
				res.status(200).send(ret);
			});
//		}
//	});
});

app.get('/medrec.getlist', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.query._token, 27, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			models.medrec.getlist(req.query, token, function(err, msg) {
				if(err) {
					ret.success = false;
					ret.msg = msg;
				} else {
					ret.success = true;
					ret.msg = 'success';
					ret.medrec_list = msg;
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.get('/appt.getlist', function(req, res) {
	var ret = {
	};
	logind.is_login_priv(req.query._token, 5, function(error, token) {
		if(error) {
			ret.success = false;
			ret.msg =token;	
			res.statius(200).send(ret);
		} else {
			console.log('request list for appointment');
			models.appt.getlist(req.query, token, function(err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
					ret.msg = msg;
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
					ret.appt_list = msg;
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.get('/schedule.getlist', function(req, res) {
	var ret = {
	};
	logind.is_login_priv(req.query._token, 6, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log('schedule list requested');
			models.schedule.getlist(req.query, function(err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
					ret.msg = msg;
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
					ret.schedule_list = msg;
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.get('/schedule.search', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.query._token, 7, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log('request search for schedule');
			models.schedule.searchlist (req.query, function(err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
					ret.msg = msg;
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
					ret.schedule_list = msg;
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.use('/web', express.static(__dirname + '/html'));

app.get('/*', function(req, res) {
	res.status(404).sendFile(__dirname + '/html/404.html');
});

app.post('/user.login', function(req, res) {
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
			ret.user_obj = msg;
			var token_v = {
				_id : msg._id,
				username : msg.username,
				type : msg.type,
				priviledge : msg.priviledge
			};
			tokend.create(token_v, function (error, token) {
				if(error) {
					console.error('failed to create token');
				} else {
//					delete ret.user_obj.iat;
//					delete ret.user_obj.iss;
					ret._token = token;
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/user.recover', function(req, res) {
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

app.post('/user.changepass', function(req, res) {
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
			console.log(payload.username + ' is changing a password');
			models.user.changepass( req.body, payload, function(err2, msg) {
				if(err2) {
					console.error(err2);
					ret.success = false;
					ret.msg = msg;
				} else {
					ret.success = true;
					ret.msg = 'success';
					console.log(payload.username + ' password changed');
				}
				res.status(200).send(ret)
			});
		}
	});
});

app.post('/patient.register', function(req, res) {
	var ret = {
		success: false,
		msg: 'undefined'
	};
	console.log(req.body.username + ' is trying to register');
	models.patient.register(req.body, function(err, msg) {
		if(err) {
			console.error(msg + ' : ' + err);
			ret.success = false;
		} else {
			console.log('success');
			ret.success = true;
		}
		ret.msg = msg;
		res.status(200).send(ret);
	});
});

app.post('/patient.editinfo', function(req, res) {
	var ret = {
		success: false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 5, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log('edit patient info : ' + req.body.patient_id);
			models.patient.editinfo(req.body, token, function(err, msg) {
				if(err) {	
					console.error(err);
					ret.success = false;	
					ret.msg = msg;
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/doctor.register', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	console.log(req.body.username + ' is trying to register as doctor');
	models.doctor.register(req.body, function(err, msg) {
		if(err) {
			console.error('doctor register error : ' + err);
			ret.success = false;
			ret.msg = msg;
		} else {
			console.log('success');	
			ret.success = true;
			ret.msg = 'success';
		}
		res.status(200).send(ret);
	});
});

app.post('/officer.register', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	console.log(req.body.username + ' is trying to register as officer');
	models.officer.register(req.body, function(err, msg) {
		if(err) {
			console.error('failed : '+ err);
			ret.success = false;
			ret.msg = msg;
		} else {
			console.log('success');
			ret.success = true;
			ret.msg = 'success';
		}
		res.status(200).send(ret);
	});
});

app.post('/nurse.register', function(req, res) {
});

app.post('/pharmacy.register', function(req, res) {
});

app.post('/dept.add', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login(req.body._token, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			models.dept.adddept(req.body, function(err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
					ret.msg = msg;
				} else {
					ret.success = true;
					ret.msg = 'success';
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/medrec.add', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 10, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' request to add medical record');
			models.medrec.addrec(req.body, token, function (err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
					ret.msg = msg;
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/medrec.edit', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 10, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			models.medrec.edit(req.body, token, function (err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
				} else {
					console.log('success');
					ret.success = true;
				}
				ret.msg = msg;
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/appt.create', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 5, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' is creating an appointment');
			models.appt.create(req.body, token, function(err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
					ret.msg = msg;
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/appt.edit', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 5, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' is editing an appointment');
			models.appt.edit(req.body, function(err, msg) {
				if(err) {
					console.error(err);
					ret.success = false;
					ret.msg = msg;
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/appt.remove', function(req, res) {
	var ret = {
		success : false,
		msg : 'unedfined'
	};
	logind.is_login_priv(req.body._token, 5, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			models.appt.removeappt(req.body, function(err, msg) {
				if(err) {
					ret.success = false;
					ret.msg = msg;
				} else {
					ret.success = true;
					ret.msg = 'success';
				}
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/schedule.add', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 6, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' request to add schedule');
			models.schedule.addschedule(req.body, token, function(err, msg) {
				if(err) {
					console.error('failed : ' + err);
					ret.success = false;
				} else {
					console.log('success');
					ret.success = true;
				}
				ret.msg = msg;
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/schedule.edit', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 6, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' request to edit schedule ' + req.body.schedule_id);
			models.schedule.edit(req.body, function(err, msg) {
				if(err) {
					console.error('failed : ' +err);
					ret.success = false;
				} else {
					ret.success = true;
				}
				ret.msg = msg;
				res.status(200).send(ret);
			});
		}
	});
});
app.post('/schedule.remove', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 6, function(error, token) {
		if(error) {
			console.error(error);
			ret.success = false;
			ret.msg = token;
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
					callback(err, 'token error');
				} else {
					callback(null, res);
				}
			});
		},
		is_login_priv: function (token, priv, callback) {
			tokend.verify(token, function(err, res) {
				if(err) {
					callback(err, 'token error');
				} else {
					fs.readFile('data/user_priv.csv', function(err2, data) {
						if(err2) {
							callback(err2, 'fs error');
						} else {
							var lines = data.toString().replace(/\r\n?/g, "\n").split("\n");
							async.each(lines, function(line, cb) {
								var word = line.split(",");
								if(word[0] === priv.toString()) {
									cb(word);
								} else if(word[0] === "#") {
									cb(null);
								} else {
									cb(null);
								}
							}, function(found) {
								if(found) {
									var slot = 1;
									if(res.type === 'patient') {
										slot = 2;
									} else if(res.type === 'doctor') {	
										slot = 3;
									} else if(res.type === 'officer') {
										slot = 4;
									} else if(res.type === 'nurse') {
										slot = 5;
									} else if(res.type === 'pharmacy') {
										slot = 6;
									}
									
									if(found[slot] === "1") {
										callback(null, res);
									} else {
										callback('priv', 'no priviledge');
									}
								} else {
									callback('fs', 'priviledge not found');
								}
							});
						}
					});
				}
			});
		}
	}
}());

http.listen(4200, function() {
	console.log('listening on port 4200 (HTTP)');
});
