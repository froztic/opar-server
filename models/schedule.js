var mongoose = require("mongoose");
var async = require("async");

var Patient = require("../models/user").Patient;
var Doctor = require("../models/user").Doctor;
var Department = require("../models/dept").Department;
var Appointment = require("../models/appt").Appointment;
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
		max : 15,
		default : 0
	}
});

ScheduleSchema.statics.searchlist = function(data, callback) {
	if(!data.type || !data.object_id || !data.skip || !data.limit) {
		callback('input_err', 'incomplete input');
	} else {
		if(data.type === 'doctor') {
			Schedule.find({doctor_id : data.object_id, start_time: {$gte: Date.now()}, capacity : {$lt: 15}})
			.sort('start_time').skip(parseInt(data.skip)).limit(parseInt(data.limit))
			.populate({ path : 'doctor_id', select : 'f_name l_name', model : Doctor })
			.lean().exec(function(err, res) {
				if(err) {
					callback(err, 'db error');
				} else if(!res) {
					callback('no_schedule', 'no schedule found');
				} else {
//					Schedule.populate
					callback(null, res);
				}
			});
		} else if(data.type === 'dept') {
			DoctorDept.find({dept_id : data.object_id}, {doctor_id:1 , _id : 0}).lean().exec(function(err, res) {
				if(err) {
					callback(err, 'db error');
				} else if(!res) {
					callback('no_dept', 'department not found');
				} else if(res.length === 0) {
					callback('no_list', 'empty doctor schedule');
				} else {
					var search_ids = {"$or": []};
					async.each(res, function(id) {
						search_ids["$or"].push({"doctor_id": id.doctor_id});
					});
					search_ids.start_time = {"$gte":Date.now()};
					search_ids.capacity = {"$lt":15};
					Schedule.find(search_ids).sort('start_time').skip(parseInt(data.skip)).limit(parseInt(data.limit))
					.populate({ path : 'doctor_id', select : 'f_name l_name', model : Doctor }).lean().exec(function(err2, res2) {
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
	if(!data.doctor_id || !data.start_time || !data.end_time) {
		callback('input_err', 'incomplete input');
	} else {
		Schedule.find({doctor_id : data.doctor_id, start_time : {$gt: data.start_time}, end_time : {$lt: data.end_time}}).sort('start_time').lean().exec(function (err, res) {
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
	if(!data.doctor_id || !data.start_time || !data.end_time) {
		callback('input_err', 'incomplete input');
	} else {
		Schedule.findOne({doctor_id : data.doctor_id, start_time : {$gte : data.start_time}, end_time : {$lte: data.end_time}}).lean().exec(function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				var new_time = new Schedule({
					doctor_id : data.doctor_id,
					start_time : data.start_time,
					end_time : data.end_time
				});
				new_time.save(function(err2, res2) {
					if(err2) {
						callback(err2, 'save error');
					} else {
						callback(null, 'success');
					}
				});
			} else {
				callback('time_conflict', 'schedule conflict');
			}
		});
	}
};

ScheduleSchema.statics.edit = function(data, callback) {
	if(!data.schedule_id || !data.start_time || !data.end_time) {
		callback('input_err', 'incomplete input');
	} else {
		Schedule.findOneAndUpdate({_id : data.schedule_id}, {start_time : data.start_time, end_time : data.end_time}).lean().exec(function(err ,res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('no_data', 'schedule not found');
			} else {
				callback(null, 'success');
			}
		});
	}
};

ScheduleSchema.statics.removeschedule = function(data, callback) {
	if(!data.schedule_id) {
		callback('input_err', 'incomplete input');
	} else {
		Schedule.findOneAndRemove({_id : data.schedule_id}).lean().exec(function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('no_data', 'schedule not found');
			} else {
				DoctorDept.findOne({doctor_id : res.doctor_id}, {'dept_id' : 1}).populate({path : 'dept_id', select : 'name location', model : Department}).exec( function(err2, dept_id) {
					if(err2) {
						callback(err2, 'db error');
					} else {
						Appointment.find({schedule_id : data.schedule_id}).exec(function(err3, appts) {
							if(err3) {
								callback(err3, 'db error');
							} else {
								var no_schedule = false;
								var msg = 'undefined';
								var ret = [];
								Appointment.populate(appts, [
									{path:'patient_id', select : 'f_name l_name email', model : Patient},
									{path:'doctor_id', select : 'f_name l_name', model : Doctor},
								], function(err4, appts2) {
									if(err4) {
										callback(err4, 'db error');
									} else {
										async.eachSeries(appts2, function(appt, cb) {
											console.info(JSON.stringify(appt));
											var data = {
												type : 'undefined',
												patient_name : appt.patient_id.f_name + ' ' + appt.patient_id.l_name,
												patient_email : appt.patient_id.email,
												doctor_name : appt.doctor_id.f_name + ' ' + appt.doctor_id.l_name,
												dept_name : dept_id.name + ' (' + dept_id.location + ')',
												old_start_time : appt.schedule_id.start_time,
												old_end_time : appt.schedule_id.end_time
//												old_schedule_id : appt.schedule_id
											};
											if(no_schedule) {
												Appointment.findOneAndRemove({_id : appt._id}).lean().exec( function(err5, res5) {
													if(err5) {
														msg = 'db error';
														cb(err5);
													} else {
														data.type = 'remove';
														ret.push(data);
														cb(null);
													}
												});
											} else {
												Schedule.searchlist({type : 'dept', object_id : dept_id._id, skip : 0, limit : 1}, function(err5, lists) {
													if(err5) {
														msg = 'db error';
														cb(err5);
													} else if(lists.length === 0) {
														no_schedule = true;
														Appointment.findOneAndRemove({_id : appt._id}).lean().exec( function(err6, res6) {
															if(err6) {
																msg = 'db error';
																cb(err6);
															} else {
																data.type = 'remove';
																ret.push(data);
																cb(null);
															}
														});
													} else {
														Appointment.findOneAndUpdate({_id : appt._id}, {schedule_id : lists[0]._id, doctor_id : lists[0].doctor_id}, {new : true})
														.populate({path : 'doctor_id', select : 'f_name l_name', model : Doctor}).exec( function(err6, res6) {
															if(err6) {
																msg = 'db error';
																cb(err6);
															} else {
																data.type = 'change';
																data.new_doctor_name = res6.doctor_id.f_name + ' ' + res6.doctor_id.l_name;
																data.new_start_time = lists[0].start_time;
																data.new_end_time = lists[0].end_time;
																ret.push(data);
																cb(null);
															}
														});
													}
												});
											}
										}, function(a_err) {
											if(a_err) {
												callback(a_err, msg);
											} else {
												callback(null, ret);
											}
										});
									}
								});
							}
						});
					}
				});
			}
		});
	}
};

var Schedule = mongoose.model('schedule', ScheduleSchema);

module.exports = {
	Schedule : Schedule
};
