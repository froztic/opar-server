var mongoose = require("mongoose");

var User = require("../models/user").User;
var Patient = require("../models/user").Patient;
var Doctor = require("../models/user").Doctor;
//var Pharmacy = require("../models/user").Pharmacy;
var Nurse = require("../models/user").Nurse;

var MedRecSchema = new mongoose.Schema({
	patient_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Patient
	},
	doctor_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Doctor
	},
//	pharmacy_id : {
//		type : mongoose.Schema.Types.ObjectId,
//		ref : Pharmacy
//	},
	nurse_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Nurse
	}, 
	record_date : {
		type : Date,
		default : Date.now
	},
	body_weight : Number,
	body_height : Number,
	body_temp : Number,
	heart_pulse : Number,
	blood_pressure : String,
	symptom : String,
	disease_code : String,
	drug_list : String
});

MedRecSchema.statics.getlist = function(data, token, callback) {
	if(!data.patient_id || !data.skip || !data.limit) {
		callback('error', 'incomplete input');
	} else if(token.type === 'patient' && token._id !== data.patient_id) {
		callback('err_no_priv', 'no priviledge');
	} else {
		MedicalRecord.find({patient_id : data.patient_id})
		.populate({path: 'patient_id doctor_id nurse_id', select: 'f_name l_name', model : User})
		.sort('-record_date')
		.skip(data.skip)
		.limit(data.limit)
		.exec(function (err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('no_data', 'data not found');
			} else {
				callback(null, res);
			}
		});

	}
};

MedRecSchema.statics.addrec = function(data, token, callback) {
	if(!data.patient_id || !data.doctor_id || !data.nurse_id) {
		callback('error', 'incomplete input');
	} else {
		if(token.type === 'doctor' && data.doctor_id !== token._id) {
			callback('err_no_priv', 'no priviledge');
		} else if(token.type === 'nurse' && data.nurse_id !== token._id) {
			callback('err_no_priv', 'no priviledge');
		} else {
			var new_record = new MedicalRecord({
				patient_id : data.patient_id,
				doctor_id : data.doctor_id,
//				pharmacy_id : data.pharmacy_id,
				nurse_id : data.nurse_id,
				body_weight : data.body_weight,
				body_height : data.body_height,
				body_temp : data.body_temp,
				heart_pulse : data.heart_pulse,
				blood_pressure : data.blood_pressure,
				symptom : data.symptom,
				disease_code : data.disease_code,
				drug_list : data.drug_list
			});
			new_record.save(function(err,res) {
				if(err) {
					callback(err, 'cannot save');
				} else {
					callback(null, 'success');
				}
			});
		}
	}
};

MedRecSchema.statics.edit = function(data, token, callback) {
	if(!data.medrec_data) {
		callback('error', 'incomplete input');
	} else {
		if(token.type === 'doctor' && data.medrec_data.doctor_id !== token._id) {
			callback('err_no_priv', 'no priviledge');
		} else if(token.type === 'nurse' && data.medrec_data.nurse_id !== token._id) {
			callback('err_no_priv', 'no priviledge');
		} else {
			var md = data.medrec_data;
			MedicalRecord.findOneAndUpdate({_id : md._id}, {
				patient_id : md.patient_id,
				doctor_id : md.doctor_id,
				nurse_id : md.nurse_id,
				body_weight : md.body_weight,
				body_height : md.body_height,
				body_temp : md.body_temp,
				heart_pulse : md.heart_pulse,
				blood_pressure : md.blood_pressure,
				symptom : md.symptom,
				disease_code : md.disease_code,
				drug_list : md.drug_list
			}).lean().exec(function(err, res) {
				if(err) {
					callback(err, 'db error');
				} else if(!res) {
					callback('no_medrec', 'medical record not found');
				} else {
					callback(null, 'success');
				}
			});
		}
	}
};

//pack code into model
var MedicalRecord = mongoose.model('medrec', MedRecSchema);

module.exports = {
	MedicalRecord : MedicalRecord
};
