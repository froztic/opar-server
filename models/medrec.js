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



//pack code into model
var MedicalRecord = mongoose.model('medrec', MedRecSchema);

module.exports = {
	MedicalRecord : MedicalRecord
};
