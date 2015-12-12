var mongoose = require('mongoose');

var User = require("../models/user").User;

var ResetSchema = new mongoose.Schema({
	user_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : User
	},
	reset_token : {
		type : String
	},
	create_at : {
		type : Date,
		default : Date.now,
		expires : 120
	}
});

ResetSchema.statics.create = function(userid, callback) {
	require('crypto').randomBytes(48, function(ex, buf) {
		if(ex) {
			callback(ex, 'cannot generate token');
		} else {
			var token = buf.toString('hex');
			var new_reset = new Reset({
				user_id : userid,
				reset_token : token
			});
			new_reset.save(function(err, res) {
				if(err) {
					callback(err, 'cannot save reset token');
				} else {
					callback(null, token);
				}
			});
		}
	});
};


var Reset = mongoose.model('reset', ResetSchema);

module.exports = {
	Reset : Reset
};
