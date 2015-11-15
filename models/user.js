var mongoose = require('mongoose');

var options = { discriminatorKey : 'type' };

var UserSchema = new mongoose.Schema({
	username : {
		type : String,
		index : true
	},
	password : String,
	email : String,
	phone : String,
	avatar_url : String,
	f_name : String,
	l_name : String,
	gender : String,
	register_date : {
		type : Date,
		default : Date.now
	}
}, options);

var PatientSchema = new mongoose.Schema({
	national_id : {
		type: String,
		trim : true
	}, 
	birthday : Date,
	address : String,
	province : String,
	zip_code : Number,
	country : String,
	blood_type : {
		type : String,
		enum : ['A', 'B', 'AB', 'O']
	},
	drug_hist : {
		type : String,
		default : 'ไม่มี'
	},
	ban_until : {
		type : Date,
		default : Date.now
	},
	allergy : {
		type : String,
		default : 'ไม่มี'
	},
	priviledge : {
		type : Number,
		default : 1
	}
}, options);

var DoctorSchema = new mongoose.Schema({
	dept_id : {
		type : mongoose.Schema.Types.ObjectId,
		ref : 'dept'
	},
	speciality : String,
	priviledge : {
		type : Number,
		default : 2
	}
}, options);

var OfficerSchema = new mongoose.Schema({
	priviledge : {
		type : Number,
		default : 4
	}
}, options);

var NurseSchema = new mongoose.Schema({
	priviledge : {
		type : Number,
		default : 8
	}
}, options);

var PharmacySchema = new mongoose.Schema({
	priviledge : {
		type : Number,
		default : 16
	}
}, options);


//pack code into model
var User = mongoose.model('user', UserSchema, 'users');
var Patient = User.discriminator('patient', PatientSchema);
var Doctor = User.discriminator('doctor', DoctorSchema);
var Officer = User.discriminator('officer', OfficerSchema);
var Nurse = User.discriminator('nurse', NurseSchema);
var Pharmacy = User.discriminator('pharmacy', PharmacySchema);

module.exports = {
	User : User,
	Patient : Patient,
	Doctor : Doctor,
	Officer : Officer,
	Nurse : Nurse,
	Pharmacy : Pharmacy
};

