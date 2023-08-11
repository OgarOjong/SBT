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
		role: {
			type: String,
			enum: ["customer_care", "finance_admin", "auditor"],
			default: "customer_care",
		},
	},
	{
		timestamps: true,
	}
);

//passportLocalMongoose will add a username, salt the password and also add a password field.
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("User", userSchema);
