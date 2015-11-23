var mongoose = require('mongoose');

var Department = require("../models/dept").Department;
var DoctorDept = require("../models/doctordept").DoctorDept;

var options = { discriminatorKey : 'type' };

var UserSchema = new mongoose.Schema({
	username : {
		type : String,
		index : true
	},
	password : String,
	email : String,
	phone : String,
	f_name : String,
	l_name : String,
	gender : String,
	register_date : {
		type : Date,
		default : Date.now
	}
}, options);

var PatientSchema = new mongoose.Schema({
	national_id : {
		type: String,
		trim : true
	}, 
	birthday : Date,
	address : String,
	blood_type : {
		type : String,
		enum : ['A', 'B', 'AB', 'O']
	},
	drug_hist : {
		type : String,
		default : 'ไม่มี'
	},
	ban_until : {
		type : Date,
		default : Date.now
	},
	priviledge : {
		type : Number,
		default : 1
	}
}, options);

var DoctorSchema = new mongoose.Schema({
	dept_id : {
		type : String,
		ref : Department
	},
	priviledge : {
		type : Number,
		default : 2
	}
}, options);

var OfficerSchema = new mongoose.Schema({
	priviledge : {
		type : Number,
		default : 4
	}
}, options);

var NurseSchema = new mongoose.Schema({
	priviledge : {
		type : Number,
		default : 8
	}
}, options);

var PharmacySchema = new mongoose.Schema({
	priviledge : {
		type : Number,
		default : 16
	}
}, options);

UserSchema.statics.login = function(data, callback) {
	if(!data.username || !data.password) {
		callback('input_error', 'incomplete input');
	} else {
		User.findOne({username : data.username, password : data.password}, {'username':1, 'type':1, 'priviledge':1, 'f_name':1, 'l_name':1}).lean().exec( function (err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
//				Patient.findOne({national_id : data.username, password : data.password}, {'username':1, 'priviledge':1}).lean().exec( function(err2,res2) {
//					if(err2) {
//						callback(err2, 'db error');
//					} else if(!res2) {
						callback('error', 'authen failed');
//					} else {
//						callback(null, res);
//					}
//				});
			} else {
				callback(null, res);
			}
		});
	}
};

UserSchema.statics.recover = function(data, callback) {
	if(!data.email) {
		callback('input_error', 'incomplete input');
	} else {
		callback('error', 'not impletented');
	}
};

UserSchema.statics.changepass = function(data, userObj, callback) {
	if(!data.old_pass || !data.new_pass) {
		callback('input_error', 'incomplete input');
	} else {
		User.findOneAndUpdate({_id: userObj._id, password : data.old_pass}, {password: data.new_pass}, {select: {'username':1}, new : true}).lean().exec( function (err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('incorrect_password', 'wrong password');
			} else {
				callback(null, res);
			}
		});
	}
};

PatientSchema.statics.register = function(data, callback) {
	if(!data.national_id || !data.password || !data.email || data.email.indexOf("@") === -1) {
		callback('input_error', 'incomplete input');
	} else {
		Patient.findOne({national_id : data.national_id}, {'username':1}).lean().exec( function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if (!res) {
				User.findOne({email: data.email}, {'username':1}).lean().exec( function(err2, res2) {
					if(err2) {
						callback(err2, 'db error');
					} else if(!res2) {
						var new_patient = new Patient({
							username : data.national_id,
							password : data.password,
							email : data.email,
							phone : data.phone,
							f_name : data.f_name,
							l_name : data.l_name,
							national_id : data.national_id,
							birthday : data.birthday,
							gender : data.gender,
							address : data.address,
							blood_type : data.blood_type,
							drug_hist : data.drug_hist
//							allergy : data.allergy
						});
						new_patient.save( function(err3, res3) {
							if(err3) {
								console.error('cannot save : ' + err3);
								callback(err3, 'cannot save');
							} else {
								callback(null, 'success');
							}
						});
					} else {
						callback('email_in_use', 'email exist');
					}
				});
			} else {
				callback('national_id_in_use', 'national_id exist');
			}
		});
	}
};

PatientSchema.statics.getinfo = function(data, token, callback) {
	if(!data.patient_id) {
		callback('input_error', 'incomplete input');
	} else {
		if(token.type === 'patient') {
			if(token._id === data.petient_id) {
				callback('no_priv_access', 'no priviledge');
			} else {
				Patient.findOne({ _id : token._id}, {'password':0, 'priviledge':0}).lean().exec( function(err, res) {
					if(err) {
						callback(err, 'db error');
					} else if (!res) {
						callback('not_found', 'not found');
					} else {
						callback(null, res);
					}
				});
			}
		} else {
			Patient.findOne({ _id : data.patient_id}, {'password':0, 'priviledge':0}).lean().exec( function(err, res) {
				if(err) {
					callback(err,'db error');
				} else if(!res) {
					callback('not_found', 'not found');
				} else {
					callback(null, res);
				}
			});
		}
	}
};

PatientSchema.statics.getlist = function(data, callback) {
	if(!data.search_params || !data.skip || !data.limit) {
		callback('input_error', 'incomplete input');
	} else {
		Patient.aggregate({
			$project: {
				name: { $concat : [ "$f_name", " ", "$l_name"] },
				f_name : 1,
				l_name : 1,
				gender : 1,
				national_id : 1,
				country : 1
			}
		})
		.match({ name: { $regex : data.search_params, $options : 'i' } })
		.sort('name')
		.skip(parseInt(data.skip))
		.limit(parseInt(data.limit))
		.exec( function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('no_data', 'name not found');
			} else {
				callback(null, res);
			}
		});
	}
};

PatientSchema.statics.editinfo = function(data, token, callback) {
	if(!data.patient_id || !data.patient_obj) {
		callback('input_error', 'incomplete input');
	} else if(token.type === 'patient' && data.patient_id !== token._id) {
		callback('user_priv_err', 'no priviledge');
	} else {
		var obj = data.patient_obj;
		Patient.findOneAndUpdate({_id : data.patient_id}, {
			email : obj.email,
			f_name : obj.f_name,
			l_name : obj.l_name,
			phone : obj.phone,
			gender : obj.gender,
			address : obj.address,
			drug_hist : obj.drug_hist
		}, {username:1}).lean().exec(function (err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('no_user', 'user not found');
			} else {
				callback(null, 'success');
			}
		});
	}
};

DoctorSchema.statics.getlist = function(data, token, callback) {
	if(!data.search_params || !data.search_type || !data.skip || !data.limit) {
		callback('input_error', 'incomplete input');
	} else {
		if(data.search_type === 'name') {
			Doctor.aggregate({ 
				$project: { 
					name : { $concat : [ "$f_name", " ", "$l_name"] },
					f_name : 1,
					l_name : 1,
					dept_id : 1
				}
			}).match({ name : { $regex : data.search_params, $options : 'i'} })
//			.populate({path: 'dept_id',select: 'name'})
			.sort('name')
			.skip(parseInt(data.skip))
			.limit(parseInt(data.limit))
//			.sort('dept_id.name')
			.exec( function(err, res) {
				if(err) {
					callback(err, 'db error');
				} else if (!res){
					callback('no_data', 'name not found');
				} else {
//					callback(null, res);
					User.populate(res, {path:'dept_id', select: 'name', model : Department}, function(err2, res2) {
						if(err2) {
							callback(err2, 'db error');
						} else if(!res2) {
							callback('no_data_populate', 'populate error');
						} else {
							callback(null, res2);
						}
					});
				}
			});
		} else if(data.search_type === 'dept') {
			callback('not_support', 'search type deprecated');
//			User.find({}, { name : { $concat : [ "$f_name", " ", "$l_name"] }, f_name : 1, l_name : 1, dept_id : 1})
//			Doctor.aggregate({ $project: { name : { $concat : [ "$f_name", " ", "$l_name"] }, f_name : 1, l_name : 1, dept_id : 1 }}).exec(function (err2, res2) {
//				User.populate(res2, { path:'dept_id', select: 'name', match: { 'name' : { $regex : data.search_params, $options : 'i' } }, model : Department, options: { sort : 'dept_id._id', limit : parseInt(data.limit) } }, function(err, res) {


//					callback(err, res);
//				});
/*			.sort('name')
			.sort('dept_id._id')
			.skip(parseInt(data.skip))
			.limit(parseInt(data.limit))
			.exec( function(err, res) {
				if(err) {
					callback(err, 'db error');
				} else if(!res) {
					callback('no_data', 'dept not found');
				} else {
					callback(null, res);
				}
			});
*///			});
		} else {
			callback('invalid_input', 'no such search_type supported');
		}
	}
};

DoctorSchema.statics.register = function(data, callback) {
	if(!data.username || !data.password || !data.email || data.email.indexOf("@") === -1) {
		callback('input_err', 'incomplete input');
	} else {
		User.findOne({username : data.usernmame}, {"username":1}).lean().exec(function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				User.findOne({email : data.email}, {"email":1}).lean().exec(function(err2, res2) {
					if(err2) {
						callback(err2, 'db error');
					} else if(!res2) {
						var new_doctor = new Doctor({
							username : data.username,
							password : data.password,
							email : data.email,
							phone : data.phone,
							f_name : data.f_name,
							l_name : data.l_name,
							gender : data.gender,
							dept_id : data.dept_id
						});
						new_doctor.save(function(err3, res3) {
							if(err3) {
								callback(err3, 'cannot save');
							} else {
								DoctorDept.create(new_doctor._id, data.dept_id, function(err4, res4) {
									if(err4) {
										callback(err4, res4);
									} else {
										callback(null, 'success');
									}
								});
							}
						});
					} else {
						callback('email_in_use', 'email exist');
					}
				});
			} else {
				callback('username_in_use', 'username exist');
			}
		});
	}
};

OfficerSchema.statics.register = function(data, callback) {
	if(!data.username || !data.password || !data.email || data.email.indexOf("@") === -1) {
		callback('input_err', 'incomplete input');
	} else {
		User.findOne({username:data.username},{username:1}).lean().exec(function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				User.findOne({email : data.email}, {"email":1}).lean().exec(function(err2, res2) {
					if(err2) {
						callback(err2, 'db error');
					} else if(!res2) {
						var new_officer = new Officer({
							username : data.username,
							password : data.password,
							email : data.email,
							phone : data.phone,
							f_name : data.f_name,
							l_name : data.l_name,
							gender : data.gender
						});
						new_officer.save(function(err3, res3) {
							if(err3) {
								callback(err3, 'cannot save');
							} else {
								callback(null, 'success');
							}
						});
					} else {
						callback('email_in_use', 'email exist');
					}
				});
			} else {
				callback('username_in_use' , 'username exist');
			}
		});
	}
};

//pack code into model
var User = mongoose.model('user', UserSchema, 'users');
var Patient = User.discriminator('patient', PatientSchema);
var Doctor = User.discriminator('doctor', DoctorSchema);
var Officer = User.discriminator('officer', OfficerSchema);
var Nurse = User.discriminator('nurse', NurseSchema);
var Pharmacy = User.discriminator('pharmacy', PharmacySchema);

module.exports = {
	User : User,
	Patient : Patient,
	Doctor : Doctor,
	Officer : Officer,
	Nurse : Nurse,
	Pharmacy : Pharmacy
};

