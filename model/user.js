const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
		},
		role: {
			type: String,
			enum: ["customer_care", "finance_admin", "auditor", "jara_admin"],
			default: "customer_care",
		},
		resetPasswordToken: {
			type: String,
		},
		resetExpires: {
			type: Date,
		},
		passwordResetCount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

//passportLocalMongoose will add a username, salt the password and also add a password field.
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("User", userSchema);
