var async = require('async');

var Patient = require("./models/user").Patient;
var Doctor = require("./models/user").Doctor;
var Department = require("./models/dept").Department;
var DoctorDept = require("./models/doctordept").DoctorDept;
var Schedule = require("./models/schedule").Schedule;
var Appointment = require("./models/appt").Appointment;

exports.removeschedule = function(data, callback) {
	if(!data.schedule_id) {
		callback('input_err', 'incomplete input');
	} else {
		Schedule.findOne({_id : data.schedule_id}).lean().exec(function(err, res) {
			if(err) {
				callback(err, 'db error');
			} else if(!res) {
				callback('no_data', 'schedule not found');
			} else {
				DoctorDept.findOne({doctor_id : res.doctor_id}, {'dept_id' : 1}).populate({path : 'dept_id', select : 'name location', model : Department}).exec( function(err2, res2) {
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
									{path:'schedule_id', select : 'start_time end_time', model : Schedule}
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
												dept_name : res2.dept_id.name + ' (' + res2.dept_id.location + ')',
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
												var skip_val = 0;
												async.forever(
													function(next) {
														Schedule.searchlist({type : 'dept', object_id : res2.dept_id._id, skip : skip_val + '', limit : 1}, function(err5, lists) {
															if(err5) {
																msg = 'db error';
																next(err5);
															} else if(lists.length === 0) {
																no_schedule = true;
																Appointment.findOneAndRemove({_id : appt._id}).lean().exec( function(err6, res6) {
																	if(err6) {
																		msg = 'db error';
																		next(err6);
																	} else {
																		data.type = 'remove';
																		ret.push(data);
																		next('ok');
																	}
																});
															} else {
																Appointment.findOne({patient_id : appt.patient_id._id, schedule_id : lists[0]._id}).lean().exec( function(err6, res6) {
																	if(err6) {
																		msg = 'db error';
																		next(err6);
																	} else if (!res6) {
																		Appointment.findOneAndUpdate({_id : appt._id}, {schedule_id : lists[0]._id, doctor_id : lists[0].doctor_id}, {new : true})
																		.populate({path : 'doctor_id', select : 'f_name l_name', model : Doctor}).exec( function(err7, res7) {
																			if(err7) {
																				msg = 'db error';
																				next(err7);
																			} else {
																				data.type = 'change';
																				data.new_doctor_name = res7.doctor_id.f_name + ' ' + res7.doctor_id.l_name;
																				data.new_start_time = lists[0].start_time;
																				data.new_end_time = lists[0].end_time;
																				ret.push(data);
	//																			next('ok');
																				Schedule.findOneAndUpdate({_id : lists[0]._id}, {$inc: {capacity:1} }).lean().exec(function(err8, res8) {
																					if(err8) {
																						msg = 'db error';
																						next(err8);
																					} else {
																						next('ok');
																					}
																				});
																			}
																		});
																	} else {
																		skip_val += 1;
																		next(null);
																	}
																});
															}
														});
													}, function(stop) {
														if(stop !== 'ok') {
															cb(stop);
														} else {
															cb(null);
														}
													}
												);
											}
										}, function(a_err) {
											if(a_err) {
												callback(a_err, msg);
											} else {
//												callback(null, ret);
												Schedule.findOneAndRemove({_id : data.schedule_id}).lean().exec(function(err8, res8) {
													if(err8) {
														callback(err8, 'db error');
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
		});
	}
};

