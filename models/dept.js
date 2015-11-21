var mongoose = require('mongoose');
var async = require('async');

var DepartmentSchema = new mongoose.Schema({
	name : String,
	location : String
});

DepartmentSchema.statics.getlist = function(search, callback) {
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

var Department = mongoose.model('dept', DepartmentSchema);

module.exports = {
	Department : Department
};
