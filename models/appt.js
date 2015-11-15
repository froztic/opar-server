var mongoose = require("mongoose");

var Patient = require("../models/user").Patient;
var Doctor = require("../models/user").Doctor;
var Department = require("../models/dept").Department;

var AppointmentSchema = new mongoose.Schema({
	patient_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Patient
	},
	doctor_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Doctor
	},
	dept_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Department
	},
	create_date : {
		type : Date,
		default : Date.now
	},
	appt_date : Date,
	is_attend : Boolean,
	attend_date : Date
});


var Appointment = mongoose.model('appt', AppointmentSchema);

module.exports = {
	Appointment : Appointment
};
