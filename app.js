var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var async = require('async');
var cors = require('cors');

var nodemailer = require('nodemailer');
var xoauth2 = require('xoauth2');

require("console-stamp")(console, "yyyy-mm-dd HH:MM:ss.l");

mongoose.connect('mongodb://127.0.0.1:27017/opar');

var secret = "EIFJHSGUY235THGL6KN7W9L0UIHQW2R0QP5QOJ9SDLFU23GSI8U6HE4TJG8PW4OP9OY3JG6VD8BWYTD3IF0J";
var user_mail = 'oparserver@gmail.com';
var client_root = 'http://opar.froztic.in.th/html/';

var models = {
	user : require("./models/user").User,
	patient : require("./models/user").Patient,
	doctor : require("./models/user").Doctor,
	officer : require("./models/user").Officer,
	medrec : require("./models/medrec").MedicalRecord,
	appt : require("./models/appt").Appointment,
	dept : require("./models/dept").Department,
	schedule : require("./models/schedule").Schedule,
//	appt : require("./models/appt").Appointment
};

var extjs = require("./removeschedule.js");

var tokend;

var generator = xoauth2.createXOAuth2Generator({
	user : user_mail,
	clientId : "782966741102-8mrpg453qo4o1ne17i96n5iofdmpveom.apps.googleusercontent.com",
	clientSecret : "xKx7wiLX7RS1io1RzmZYmA1g",
	refreshToken : "1/mWEECVuANQS7HltlG0ru1xEFmQoek3xBkKdZTppT_Tc",
	accessToken : "ya29.SAIG4Qy2f23-EeYhtki439zCmWfY0nON9YAeLL5NcUR5-rMvXV7weGERyjqbhQ9NETCz"
});

var transporter = nodemailer.createTransport({
	service : 'gmail',
	auth : {
		xoauth2: generator
	}
});

var sendmail = function(recv_user, recv_mail, mail_subj, mail_body) {
	transporter.sendMail({
		from : 'OPAR System <' + user_mail + '>',
		to : recv_user + ' <' + recv_mail + '>',
		headers : {"X-Entity-Ref-ID": null},
		subject : mail_subj,
		html : mail_body
	}, function(err, res) {
		if(err) {
			console.error('error sending mail to ' + recv_user + ' <' + recv_mail + '> : ' + err);
		} else {
			console.log('successfully send an email to ' + recv_user + ' <' + recv_mail + '>');
		}
	});
};

//var parser = bodyParser.json();
var parser = bodyParser.urlencoded({ extended: true, limit: '20mb' });

app.use(parser);
app.use(cors({
	origin : "*",
//	origin : "http://opar.froztic.in.th",
	methods : "GET,POST"
}));

app.disable('etag');

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
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' get patient list for "' + req.query.search_params + '"');
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
			console.log('retreiving doctor list for "' + req.query.search_params + '"');
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
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' request for medical record list');
			models.medrec.getlist(req.query, token, function(err, msg) {
				if(err) {
					console.error('failed : ' + err);
					ret.success = false;
					ret.msg = msg;
				} else {
					console.log('success');
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
	logind.is_login_priv(req.query._token, 7, function(error, token) {
		if(error) {
			ret.success = false;
			ret.msg = token;	
			res.status(200).send(ret);
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
	logind.is_login_priv(req.query._token, 7, function(error, token) {
		if(error) {
			console.error('token error : ' + error);
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
			console.error('token error : ' + error);
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
			console.error('failed');
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
	console.log('someone is trying to request password reset');
	models.user.recover(req.body, function(err, msg) {
		if(err) {
			ret.success = false;
			ret.msg = msg;
		} else {
			ret.success = true;
			ret.msg = 'success';
			res.status(200).send(ret);
			sendmail(req.body.email, req.body.email, 'รีเซทรหัสผ่าน (password reset) [' + Date.now() + ']', 'reset token : ' + msg + '<br />กรุณากดลิงค์ด้านล่างเพื่อไปยังหน้ารีเซทรหัสผ่าน และใส่ reset token ที่ได้รับมาข้างต้น<br /><a href=\'' + client_root + 'reset_password.html?token=' + msg + '\'>' + client_root + 'reset_password.html?token=' + msg + '</a><br /><br />หากคุณไม่ได้ทำรายการดังกล่าว กรุณาลบอีเมลนี้ทิ้งไป<br/ >ขอบคุณที่ใช้บริการ');
		}
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
				res.status(200).send(ret);
			});
		}
	});
});

app.post('/user.resetpass', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	console.log('reset password in progress via token : ' + req.body.reset_token);
	models.user.resetpass(req.body, function(err, msg) {
		if(err) {
			ret.success = false;
			ret.msg = msg;
			console.error(err);
		} else {
			ret.success = true;
			ret.msg = 'success';
			console.log('success');
		}
		res.status(200).send(ret);
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
			console.error('token error : ' + error);
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
	logind.is_login_priv(req.body._token, 41, function(error, token) {
		if(error) {
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
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
		}
	});
});

app.post('/officer.register', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 41, function(error, token) {
		if(error) {
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(req.body.username + ' is trying to register as officer');
			models.user.register(req.body, 'officer', function(err, msg) {
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
		}
	});
});

app.post('/nurse.register', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 41, function(error, token) {
		if(error) {
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(req.body.username + ' is trying to register as nurse');
			models.user.register(req.body, 'nurse', function(err, msg) {
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
		}
	});
});

app.post('/pharmacy.register', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 41, function(error, token) {
		if(error) {
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(req.body.username + ' is trying to register as pharmacy');
			models.user.register(req.body, 'pharmacy', function(err, msg) {
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
		}
	});
});

app.post('/dept.add', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 41, function(error, token) {
		if(error) {
			console.error('token error : ' + error);
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
			console.error('token error : ' + error);
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
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' request to edit medical record');
			models.medrec.edit(req.body, token, function (err, msg) {
				if(err) {
					console.error('error : ' + err);
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
	logind.is_login_priv(req.body._token, 7, function(error, token) {
		if(error) {
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' is creating an appointment');
			models.appt.create(req.body, token, function(err0, msg) {
				if(err0) {
					console.error('failed : ' + err0);
					ret.success = false;
					ret.msg = msg;
					res.status(200).send(ret);
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
					res.status(200).send(ret);
					async.waterfall([
						function(callback) {
							models.patient.findById(req.body.patient_id).lean().exec( function (err, doc) {
								if(err) {
									callback(err, 'db error');
								} else {
									callback(null, doc.f_name + ' ' + doc.l_name, doc.email);
								}
							});
						},
						function(patient_name, patient_email, callback) {
							models.doctor.findById(req.body.doctor_id).lean().exec( function (err, doc) {
								if(err) {
									callback(err, 'db error');
								} else {
									callback(null, patient_name, patient_email, doc.f_name + ' ' + doc.l_name, doc.dept_id);
								}
							});
						},
						function(patient_name, patient_email, doctor_name, dept_id, callback) {
							models.dept.findById(dept_id).lean().exec( function (err, doc) {
								if(err) {
									callback(err, 'db error');
								} else {
									callback(null, patient_name, patient_email, doctor_name, doc.name + ' (' + doc.location + ')');
								}
							});
						},
						function(patient_name, patient_email, doctor_name, dept_name, callback) {
							models.schedule.findById(req.body.schedule_id).lean().exec( function (err, doc) {
								if(err) {
									callback(err, 'db error');
								} else {
									callback(null, patient_name, patient_email, doctor_name, dept_name, doc.start_time, doc.end_time);
								}
							});
						},
						function(patient_name, patient_email, doctor_name, dept_name, start_date, end_date, callback) {
							sendmail(patient_name, patient_email, 'ระบบได้ทำการนัดหมายเป็นที่เรียบร้อยแล้ว [' + Date.now() + ']', 'รายละเอียดการนัดหมาย : <br />ช่วงเวลา : ' + start_date + ' ถึง ' + end_date + '<br />ผู้ป่วย : คุณ' + patient_name + '<br />แพทย์ที่นัด : ' + doctor_name + '<br />แผนก : ' + dept_name + '<br /><br />คุณสามารถเปลี่ยนแปลง ตรวจสอบ แก้ไขการนัดหมายได้ผ่านทางหน้าเว็บของระบบ <a href=\'' + client_root + '\'>OPAR System</a><br />ขอบคุณที่ใช้บริการ');
							callback(null, res);
						},
					], function(a_err, a_res) {
						if(a_err) console.error('a_err');
					});
				}
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
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' is editing an appointment');
			models.appt.editappt(req.body, function(err, msg) {
				if(err) {
					console.error('failed : ' + err);
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
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' is removing appointment ' + req.body.appt_id);
			models.appt.removeappt(req.body, function(err, msg) {
				if(err) {
					console.error('failed : ' + err);
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

app.post('/appt.setattend', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 2, function(error, token) {
		if(error) {
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' is going to set appointment attend');
			models.appt.setattend(req.body, function(err, msg) {
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

app.post('/schedule.add', function(req, res) {
	var ret = {
		success : false,
		msg : 'undefined'
	};
	logind.is_login_priv(req.body._token, 6, function(error, token) {
		if(error) {
			console.error('token error : ' + error);
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
			console.error('token error : ' + error);
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
					console.log('done');
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
			console.error('token error : ' + error);
			ret.success = false;
			ret.msg = token;
			res.status(200).send(ret);
		} else {
			console.log(token.username + ' is trying to remove schedule ' + req.body.schedule_id);
			extjs.removeschedule(req.body, function(err, msg) {
				if(err) {
					console.error('failed : ' + err);
					ret.success = false;
					ret.msg = msg;
					res.status(200).send(ret);
				} else {
					console.log('success');
					ret.success = true;
					ret.msg = 'success';
					res.status(200).send(ret);
					async.each(msg, function(mail, callback) {
						var content = "เนื่องจากแพทย์" + mail.doctor_name + "ได้ทำการยกเลิกตารางออกตรวจ ทางระบบจึงต้องขอทำการเปลี่ยนแปลงการนัดหมายที่คุณ" + mail.patient_name +  " ได้เคยนัดไปก่อนหน้า ดังนี้<br /><br />";
						if(mail.type === 'remove') {
							content += '<b>ยกเลิกการนัดหมาย</b><br />แพทย์ : ' + mail.doctor_name + '<br />แผนก : ' + mail.dept_name + '<br />ช่วงเวลา : ' + mail.old_start_time + ' ถึง ' + mail.old_end_time;
						} else if(mail.type === 'change') {
							content += '<b>เลี่อนเวลา / แพทย์ที่ทำการนัดหมาย</b><br />จากเดิมที่ได้นัดหมายกับ<br />แพทย์ : ' + mail.doctor_name + ' <br />แผนก : ' + mail.dept_name + '<br />ช่วงเวลา : ' + mail.old_start_time + ' ถึง ' + mail.old_end_time + '<br /><b>เปลี่ยนเป็น</b><br />แพทย์ : ' + mail.new_doctor_name + '<br />แผนก : ' + mail.dept_name + ' (แผนกเดิม)<br />ช่วงเวลา : ' + mail.new_start_time + ' ถึง ' + mail.new_end_time;
						} 
						content += '<br /><br /> คุณสามารถแก้ไข เปลี่ยนแปลง หรือยกเลิกการนัดหมายดังกล่าวได้ด้วยตนเองผ่านทางเว็บไซต์ <a href=\'' + client_root + '\'>OPAR System</a><br />ขอบคุณที่ใช้บริการ';
						sendmail(mail.patient_name, mail.patient_email, "แจ้งเปลี่ยนแปลงการนัดหมาย [" + Date.now() + "]", content);
						callback(null);
					}, function(err2) {
						if(err2) console.error('send mail has been halted | ' + err2);
						else console.log('done send all change mail');
					});
				}
			});
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
							if(priv.toString() === "41" && res.type === 'admin') {
								callback(null, res);
							} else {
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
						}
					});
				}
			});
		}
	}
}());

http.listen(4200, function() {
	console.log('HTTP : listening on port 4200');
});

process.on('SIGINT', function() {
	console.log('EXIT (ctrl + c)');
	process.exit();
});
/*
process.on('uncaughtException', function(err) {
	console.error('unhandled exception : ');
	console.error(err);
	console.error('app will terminated');
	process.exit();
});
*/
