var mongoose = require("mongoose");

var Patient = require("../models/user").Patient;
var Doctor = require("../models/user").Doctor;
var Department = require("../models/dept").Department;
var Schedule = require("../models/schedule").Schedule;

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
		type : String,
		ref : Department
	},
	create_date : {
		type : Date,
		default : Date.now
	},
	schedule_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Schedule
	},
	is_attend : Boolean,
	attend_date : Date,
	description : String
});

AppointmentSchema.statics.getlist = function(data, token, callback) {
	if(!data.type || !data.user_id) {
		callback('error', 'incomplete input');
	} else {
		if(data.type === 'patient') {
			if(token.type === 'patient' && data.user_id !== token._id) {
				callback('no_priv', 'no priviledge');
			} else {
				Appointment.find({patient_id : data.user_id, is_attend : false})
				.populate({path : 'schedule_id', select : 'start_time end_time'})
				.find({'dept_id.start_time' : {$gte: Date.now()} })
//				.project({dept_id.start_time : {$gte: Date.now()}})
				.sort('dept_id.start_time').skip(data.skip).limit(data.limit).lean().exec(function(err, res) {
					if(err) {
						callback(err, 'db error');
					} else if(!res) {
						callback('no_data', 'not found');
					} else {
						callback(null, res);
					}
				});
			}
		} else if(data.type === 'doctor') {
			if(token.type === 'patient') {
				callback('no_priv', 'no priviledge');
			} else {
				Appointment.find({doctor_id : data.user_id, is_attend : false})
				.populate({path : 'schedule_id', select : 'start_time end_time'})
				.find({'dept_id.start_time' : {$gte: Date.now()} })
				.sort('dept_id.start_time').skip(data.skip).limit(data.limit).lean().exec(function(err, res) {
					if(err) {
						callback(err, 'db error');
					} else if(!res) {
						callback('no_data', 'not found');
					} else {
						callback(null, res);
					}
				});
			}
		} else {
			callback('invalid_input', 'type error');
		}
	}
};

AppointmentSchema.statics.create = function(data, token, callback) {
	if(!data.doctor_id || !data.dept_id || !data.schedule_id) {
		callback('error', 'incomplete input');
	} else {
		var new_appt = new Appointment({
			patient_id : data.patient_id,
			doctor_id : data.doctor_id,
			dept_id : data.dept_id,
			schedule_id : data.schedule_id
		});
		Schedule.findOneAndUpdate({_id : new_appt.schedule_id}, {$inc: {capacity:1} }, {capacity:1}, {new:true}).lean().exec(function(err2, res2) {
			if(err2) {
				console.error(err2);
				callback(err2, 'db error');
			} else if(!res2) {
				callback('no_schedule', 'schedule not found');
			} else {
				new_appt.save(function(err, res) {
					if(err) {
						callback(err, 'db error');
					} else {
						callback(null, 'success');
					}
				});
			}
		});
	}
};

AppointmentSchema.statics.edit = function(data, callback) {
	if(!data.appt_id) {
	} else {
		Appointment.findOne({_id:data.appt_id}).exec(function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if (!res) {
				callback('no_appt', 'appt not found');
			} else {
				if(res.schedule_id !== data.schedule_id) {
					Schedule.findOneAndUpdate({_id : res.schedule_id}, {$inc: {capacity:-1} }).lean().exec(function(err2, res2) {
						if(err2) {
							callback(err2, 'db error');
						} else if(!res2) {
							callback('no_sched1', 'schedule not found');
						} else {
							Schedule.findOneAndUpdate({_id : data.schedule_id}, {$inc: {capacity:1} }).lean().exec(function(err3, res3) {
								if(err3) {
									callback(err3, 'db error');
								} else if(!res3) {
									callback('no_sched2', 'schedule not found');
								} else {
									res.doctor_id = data.doctor_id;
									res.dept_id = data.dept_id;
									res.schedule_id = data.schedule_id;
									res.save(function(err4, res4) {
										if(err4) {
											callback(err4, 'save error');
										} else {
											callback(null, 'success')
										}
									});
								}
							});
						}
					});
				} else {
					res.doctor_id = data.doctor_id;
					res.dept_id = data.dept_id;
					res.save(function (err2, res2) {
						if(err2) {
							callback(err2, 'save error');
						} else {
							callback(null, 'success');
						}
					});
				}
			}
		});
	}
};

AppointmentSchema.statics.removeappt = function(data, callback) {
	if(!data.appt_id) {
		callback('error', 'incomplete input');
	} else {
		Appointment.findOneAndRemove({_id: data.appt_id}).lean().exec(function (err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				
			} else {
				Schedule.findOneAndUpdate({_id: res.schedule_id}, {$inc: {capacity:-1}}).lean().exec(function(err2, res2) {
					if(err2) {
						callback(err2, 'db error');
					} else if(!res2) {
						callback('error', '???');
					} else {
						callback(null, 'success');
					}
				});
			}
		});
	}
};

var Appointment = mongoose.model('appt', AppointmentSchema);

module.exports = {
	Appointment : Appointment
};
