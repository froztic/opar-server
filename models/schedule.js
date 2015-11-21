var mongoose = require("mongoose");
var async = require("async");

var Doctor = require("../models/user").Doctor;
var Department = require("../models/dept").Department;
var DoctorDept = require("../models/doctordept").DoctorDept;

var ScheduleSchema = new mongoose.Schema({
	doctor_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Doctor
	},
	start_time : Date,
	end_time : Date,
	capacity : {
		type : Number,
		min : 0,
		max : 20,
		default : 0
	}
});

ScheduleSchema.statics.search = function(data, callback) {
	if(!data.type || !data.object_id) {
		callback('input_err', 'incomplete input');
	} else {
		if(data.type === 'doctor') {
			
		} else if(data.type === 'dept') {
			DoctorDept.find({dept_id : data.object_id}, {doctor_id:1 , _id : 0}).lean().exec(function(err, res) {
				if(err) {
				} else if(!res) {
				} else {
					var ids = {"$or": []};
					async.each(res, function(id) {
						ids["$or"].push({"doctor_id": id.doctor_id});
					});
					callback('err', 'not finished');
				}
			});
		} else {
			callback('incorrect_type', 'incorrect search type');
		}
	}
};

var Schedule = mongoose.model('schedule', ScheduleSchema);

module.exports = {
	Doctor : Doctor
};
