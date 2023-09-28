const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jaraSchema = new Schema(
	{
		uploader: String,
		ip: String,
		os: String,
		uploaderEmail: String,
		user: {
			type: Schema.Types.ObjectId,
			ref: "User", // Make sure this matches the name of your User model
		},
		csv: {},
		profiledDate: {
			type: Date,
		},
		/*smsstatus: {
			type: String,
			default: "unsent",
		}, */
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Jara", jaraSchema);
