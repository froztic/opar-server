var mongoose = require('mongoose');

var Department = require("../models/dept").Department

var options = { discriminatorKey : 'type' };

var UserSchema = new mongoose.Schema({
	username : {
		type : String,
		index : true
	},
	password : String,
	email : String,
	phone : String,
	avatar_url : String,
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
	province : String,
	zip_code : Number,
	country : String,
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
	allergy : {
		type : String,
		default : 'ไม่มี'
	},
	priviledge : {
		type : Number,
		default : 1
	}
}, options);

var DoctorSchema = new mongoose.Schema({
	dept_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Department
	},
	speciality : String,
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
		User.findOne({username : data.username, password : data.password}, {'username':1, 'type':1, 'priviledge':1}).lean().exec( function (err, res) {
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
	if(!data.national_id || !data.password) {
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
							province : data.province,
							zip_code : data.zip_code,
							country : data.country,
							blood_type : data.blood_type,
							drug_hist : data.drug_hist
//							allergy : data.allergy
						});
						new_patient.save( function(err3, res3) {
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
	if(!data.search_params) {
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
		}).match({ name: { $regex : '/' + data.search_params + '/i' } })
		.sort('name')
		.limit(50)
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

PatientSchema.statics.editinfo = function(data, callback) {
	if(!data.patient_id || !data.patient_obj) {
		callback('input_error', 'incomplete input');
	} else {
//		Patient.findOne({_id : data.patient_id}, 
	}
};

DoctorSchema.statics.getlist = function(data, token, callback) {
	if(!data.search_params || !data.search_type) {
		callback('input_error', 'incomplete input');
	} else {
		if(data.search_type === 'name') {
			Doctor.aggregate({ 
				$project: { 
					name : { $concat : [ "$f_name", " ", "$l_name"] },
					f_name : 1,
					l_name : 1,
					dept_id : 1,
					speciality : 1
				}
			}).match({ name : { $regex : '/' + data.search_params + '/i' } })
			.limit(50)
//			.populate({
//				path: 'dept_id',
//				select: 'name'
//			})
			.sort('name')
//			.sort('dept_id.name')
			.exec( function(err, res) {
				if(err) {
					callback(err, 'db error');
				} else if (!res){
					callback('no_data', 'name not found');
				} else {
					Doctor.populate(res, {path:'dept_id', select: 'name'}, function(err2, res2) {
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
		} else {
		}
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

