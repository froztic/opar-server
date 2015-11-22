var mongoose = require("mongoose");

var Doctor = require("../models/user").Doctor;
var Dept = require("../models/dept").Department;

var DoctorDeptSchema = new mongoose.Schema({
	doctor_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : Doctor,
		index : true
	},
	dept_id : {
		type : String,
		ref : Dept,
		index : true
	},
});

DoctorDeptSchema.statics.create = function(doctor, dept, callback) {
	var dd = new DoctorDept({
		doctor_id : doctor,
		dept_id : dept
	});
	dd.save( function(error, results) {
		if(error) {
			callback(error, 'db error');
		} else {
			callback(null, 'success');
		}
	});
};


var DoctorDept = mongoose.model('doctordept', DoctorDeptSchema);

module.exports = {
	DoctorDept : DoctorDept
};
