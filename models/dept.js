var mongoose = require('mongoose');
var async = require('async');

var DepartmentSchema = new mongoose.Schema({
	_id : {
		type : String,
		index : true
	},
	name : {
		type : String,
		index : true
	},
	location : String
});

DepartmentSchema.statics.getlist = function(callback) {
//	Department.find({name : {$regex: search, $options: 'i'}}).lean().exec(function(err, res) {
	Department.find({}).lean().exec(function(err, res) {
		if(err) {
			callback(err, 'db error');
//		} else if(!res) {
//			callback('no_data', 'no data');
		} else {
			callback(null, res);
		}
	});
};

DepartmentSchema.statics.adddept = function(data, callback) {
	if(!data.name) {
		callback('input_err', 'incomplete input');
	} else {
		var new_dept = Demartment({
			name : data.name,
			location : data.location
		});
		new_dept.save(function (err, res) {
			if(err) {
				callback(err, 'cannot save');
			} else {
				callback(null, 'success');
			}
		});
	}
};

var Department = mongoose.model('dept', DepartmentSchema);

module.exports = {
	Department : Department
};
