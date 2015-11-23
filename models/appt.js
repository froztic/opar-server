var mongoose = require("mongoose");

var User = require("../models/user").User;
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
	create_date : {
		type : Date,
		default : Date.now
	},
	schedule_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Schedule
	},
	is_attend : {
		type : Boolean,
		default : false
	},
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
				.populate({path : 'schedule_id', select : 'start_time end_time', match: { start_time : { $gte : Date.now() } },  model : Schedule}).exec(function(err2, res2) {
					if(err2) { 
						callback(err2, 'db error');
					} else if (!res2) { 
						callback('no_data', 'not found');
					} else {
						for(var i = res2.length - 1; i >=0; i-- ) {
							if(res2[i].schedule_id === null) {
								res2.splice(i, 1);
							}
						}
						res2.sort(function(a, b) {
							return (new Date(a.schedule_id.start_time) - new Date(b.schedule_id.start_time));
						});
						res2.splice(0, parseInt(data.skip));
						res2.splice(parseInt(data.limit), res2.length);
						Appointment.populate(res2,[
							{path : 'patient_id', select : 'f_name l_name', model : Patient},
							{path : 'doctor_id', select : 'f_name l_name dept_id', model : Doctor}
						], function(err, res) {
							if(err) {
								callback(err, 'db error');
							} else if(!res) {
								callback('wtf', 'cannot populate !!?!?');
							} else {
								callback(null, res);
							}
						});			
					}
				});
			}
		} else if(data.type === 'doctor') {
			if(token.type === 'patient') {
				callback('no_priv', 'no priviledge');
			} else {
				Appointment.find({doctor_id : data.user_id, is_attend : false})
				.populate({path : 'schedule_id', select : 'start_time end_time', match: { start_time : { $gte : Date.now() } },  model : Schedule}).exec(function(err2, res2) {
					if(err2) {
						callback(err2, 'db error');
					} else if (!res2) {
						callback('no_data', 'not found');
					} else {
						for(var i = res2.length - 1; i >=0; i-- ) {
							if(res2[i].schedule_id === null) {
								res2.splice(i, 1);
							}
						}
						res2.sort(function(a, b) {
							return (new Date(a.schedule_id.start_time) - new Date(b.schedule_id.start_time));
						});
						res2.splice(0, parseInt(data.skip));
						res2.splice(parseInt(data.limit), res2.length);
						Appointment.populate(res2, [
							{path : 'patient_id', select : 'f_name l_name', model : Patient},
							{path : 'doctor_id', select : 'f_name l_name dept_id', model : Doctor}
						], function(err, res) {
							if(err) {
								callback(err, 'db error');
							} else if(!res) {
								callback('wtf', 'cannot populate !!?!?');
							} else {
								callback(null, res);
							}
						});
					}
				});

/*				Appointment.find({doctor_id : data.user_id, is_attend : false})
				.populate({path : 'schedule_id', select : 'start_time end_time', model : Schedule})
				.find({'schedule_id.start_time' : {$gte: Date.now()} })
				.sort('schedule_id.start_time').skip(parseInt(data.skip)).limit(parseInt(data.limit))
				.populate({path : 'doctor_id patient_id', select : 'f_name l_name', model : User})
				.lean().exec(function(err, res) {
					if(err) {
						callback(err, 'db error');
					} else if(!res) {
						callback('no_data', 'not found');
					} else {
						callback(null, res);
					}
				});
*/			}
		} else {
			callback('invalid_input', 'type error');
		}
	}
};

AppointmentSchema.statics.create = function(data, token, callback) {
	if(!data.doctor_id || !data.patient_id || !data.schedule_id) {
		callback('error', 'incomplete input');
	} else {
		Appointment.findOne({patient_id : data.patient_id, schedule_id : data.schedule_id}).lean().exec(function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if (!res) {
				var new_appt = new Appointment({
					patient_id : data.patient_id,
					doctor_id : data.doctor_id,
					schedule_id : data.schedule_id
				});
				if(data.description) {
					new_appt.description = data.description;
				}
				Schedule.findOneAndUpdate({_id : new_appt.schedule_id}, {$inc: {capacity:1} }, {new:true}).lean().exec(function(err2, res2) {
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
			} else {
				callback('alreasy_exist', 'cannot create : already has appointment !!');
			}
		});
	}
};

AppointmentSchema.statics.edit = function(data, callback) {
	if(!data.appt_id) {
		callback('input_err', 'incomplete input');
	} else {
		Appointment.findOne({_id:data.appt_id}).exec(function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if (!res) {
				callback('no_appt', 'appt not found');
			} else {
				if(res.schedule_id !== data.schedule_id) {
					Appointment.findOne({patient_id : res.patient_id, schedule_id:data.schedule_id}).lean().exec(function(err5, res5) {
						if(err5) {
							callback(err5, 'db error');
						}else if(!res5) {
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
											res.schedule_id = data.schedule_id;
											if(data.description) {
												res.description = data.description;
											} else {
												res.description = "";
											}
											res.save(function(err4, res4) {
											if(err4) {
													callback(err4, 'save error');
												} else {
													callback(null, 'success');
												}
											});
										}
									});
								}
							});
						} else {
							callback('alreasy_exist', 'cannot change : already has appointment !!');
						}
					});
				} else {
					res.doctor_id = data.doctor_id;
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
		Appointment.findOneAndRemove({_id: data.appt_id}).exec(function (err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('no_appt', 'appt not found');
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

AppointmentSchema.statics.setattend = function(data, callback) {
	if(!data.appt_id) {
		callback('error', 'incomplete input');
	} else {
		Appointment.findOneANdUpdate({_id : data.appt_id}, {is_attend: true}).lean().exec(function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('no_appt', 'appt not found');
			} else {
				callback(null, 'success');
			}
		});
	}
};

var Appointment = mongoose.model('appt', AppointmentSchema);

module.exports = {
	Appointment : Appointment
};
