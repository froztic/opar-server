var mongoose = require("mongoose");

var Patient = require("../models/user").Patient;
var Doctor = require("../models/user").Doctor;
var Pharmacy = require("../models/user").Pharmacy;
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
	pharmacy_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Pharmacy
	},
	nurse_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Nurse
	}, 
	record_date : Date,
	body_weight : Number,
	body_height : Number,
	body_temp : Number,
	heart_pulse : Number,
	blood_pressure : Number,
	symptom : String,
	disease_code : String
});

MedRecSchema.statics.getlist = function(data, token, callback) {
	if(!data.patient_id) {
		callback('error', 'incomplete input');
	} else if(token.type === 'patient' && token._id !== data.patient_id) {
		callback('err_no_priv', 'no priviledge');
	} else {
		MedicalRecord.find({patient_id : data.patient_id})
		.populate({path: 'patient_id doctor_id pharmacy_id nurse_id', select: 'f_name l_name'}).exec(function (err, res) {
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
//	if(false) {
//	} else {
	var new_record = new MedicalRecord({
		patient_id : data.patient_id,
		doctor_id : token._id,
		pharmacy_id : data.pharmacy_id,
		nurse_id : data.nurse_id,
		body_weight : data.body_weight,
		body_height : data.body_height,
		body_temp : data.body_temp,
		heart_pulse : data.heart_pulse,
		blood_pressure : data.blood_pressure,
		symptom : data.symptom,
		disease_code : data.disease_code
	});
	
//	}
};

//pack code into model
var MedicalRecord = mongoose.model('medrec', MedRecSchema);

module.exports = {
	MedicalRecord : MedicalRecord
};
