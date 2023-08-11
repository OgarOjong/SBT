const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fileSchema = new Schema(
	{
		uploader: String,
		bank: String,
		location: String,
		ip: String,
		os: String,
		uploaderEmail: String,
		user: {
			type: Schema.Types.ObjectId,
			ref: "User", // Make sure this matches the name of your User model
		},
		csv: {},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Files", fileSchema);
