const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fcmbSchema = new Schema({
	uploader: String,
	bank: String,
	location: String,
	ip: String,
	os: String,
	SN: String,
	"Tran Date": String,
	"Value Date": String,
	Reference: String,
	"Transaction Details": String,
	Withdrawal: String,
	Deposit: String,
	Balance: String,
});

module.exports = mongoose.model("FCMB", fcmbSchema);
