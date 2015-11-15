var mongoose = require('mongoose');

var Doctor = require("../models/user").Doctor;

var ScheduleSchema = new mongoose.Schema({
	doctor_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Doctor
	},
	start_time : Date,
	end_time : Date
});

var Schedule = mongoose.model('schedule', ScheduleSchema);

module.exports = {
	Doctor : Doctor
};
