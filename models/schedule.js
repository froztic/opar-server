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

ScheduleSchema.statics.searchlist = function(data, callback) {
	if(!data.type || !data.object_id) {
		callback('input_err', 'incomplete input');
	} else {
		if(data.type === 'doctor') {
			Schedule.find({doctor_id : data.object_id, start_time: Date.now()}).limit(50).lean().exec(function(err, res) {
				if(err) {
					callback(err, 'db error');
				} else if(!res) {
					callback('no_schedule', 'no schedule found');
				} else {
					callback(null, res);
				}
			});
		} else if(data.type === 'dept') {
			DoctorDept.find({dept_id : data.object_id}, {doctor_id:1 , _id : 0}).lean().exec(function(err, res) {
				if(err) {
					callback(err, 'db error');
				} else if(!res) {
					callback('no_dept', 'department not found');
				} else {
					var search_ids = {"$or": []};
					async.each(res, function(id) {
						search_ids["$or"].push({"doctor_id": id.doctor_id});
					});
					search_ids.start_time = {"$lt":Date.now()};
					Schedule.find(search_ids).sort('start_time').limit(50).lean().exec(function(err2, res2) {
						if(err2) {
							callback(err2, 'db error');
						} else if(!res2) {
							callback('no_schedule', 'no schedule found');
						} else {
							callback(null, res2);
						}
					});
				}
			});
		} else {
			callback('incorrect_type', 'incorrect search type');
		}
	}
};

ScheduleSchema.statics.getlist = function(data, callback) {
	if(!data.doctor_id) {
		callback('input_err', 'incomplete input');
	} else {
		Schedule.find({doctor_id : data.doctor_id, start_time : {$gt: data.start_time}, end_time : {$lt: data.end_time}}).lean().exec(function (err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('no_schedule', 'no schedule found');
			} else {
				callback(null, res);
			}
		});
	}
};

ScheduleSchema.statics.addschedule = function(data, token, callback) {
};

ScheduleSchema.statics.edit = function(data, callback) {
};

ScheduleSchema.statics.removeschedule = function(data, callback) {
};

var Schedule = mongoose.model('schedule', ScheduleSchema);

module.exports = {
	Doctor : Doctor
};
