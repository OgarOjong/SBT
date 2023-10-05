const express = require("express");
const router = express.Router({ mergeParams: true });
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const flash = require("connect-flash");
const {
	upload,
	getBanks,
	updateFile,
	findTransaction,
	filesLeastDate,
} = require("../services/upload");
const { bankDump, writeCsvFile } = require("../services/downloadUtil");
const multer = require("multer");
const path = require("path");
const {
	getFiles,
	getSingleFile,
	archiveSingleFile,
} = require("../services/files");

const ObjectID = require("mongoose").Types.ObjectId;
const {
	isLoggedIn,
	disableCaching,
	roleManager,
	transactionUpdateStatus,
} = require("../middleware/middleware");

const {
	getBankFiles,
	getBankFilesByUpdate,
} = require("../services/bankValidator");
const { logger } = require("../utils/logger");
const { object } = require("joi");
//const bankConfig = require("../configs/banks");

router.get("/", disableCaching, isLoggedIn, roleManager, async (req, res) => {
	const banks = getBanks();
	res.render("banking/index", {
		user: req?.user,
		banks,
	});
});

router.post("/", roleManager, disableCaching, isLoggedIn, async (req, res) => {
	let { startDate, endDate, bank, location } = req.body;

	if (!req.body || !startDate || !endDate || !bank || !location) {
		req.flash("error", "Please input all values");
		return res.redirect("/bank");
	}
	try {
		let startDateModified = new Date(startDate).toISOString().split("T")[0];
		let endDateModified = new Date(endDate).toISOString().split("T")[0];
		const leastDateObj = await filesLeastDate();

		let { minDate, maxDate } = leastDateObj.message;

		minDate = new Date(leastDateObj.message.minDate)
			.toISOString()
			.split("T")[0];
		maxDate = new Date(leastDateObj.message.maxDate)
			.toISOString()
			.split("T")[0];

		if (startDateModified < minDate) {
			req.flash(
				"error",
				`Start Date precedes the tracker launch Date minDate ${minDate}`
			);
			return res.redirect("/banking");
		} else if (endDateModified > maxDate) {
			console.log("endDate", endDate);
			console.log("MaxDate", maxDate);
			req.flash("error", `No file update after EndDate, maxDate ${maxDate}`);
			return res.redirect("/banking");
		}
		const dumpPayload = { bank, location, startDate, endDate };

		const newBankDump = await bankDump(dumpPayload);
		let fileCreation = await writeCsvFile(newBankDump, bank);
		if (fileCreation?.ok) {
			const { file, folderPath, fileSize } = fileCreation;
			const fileFullPath = path.join(folderPath, file);
			// Set response headers for CSV download
			res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
			res.setHeader("Content-type", "text/csv");
			res.setHeader("Content-Length", fileSize);

			// Send the CSV file as a response
			res.sendFile(fileFullPath);
			return;
		}
		req.flash("error", "Error Downloading files");
		res.redirect("/banking");
	} catch (error) {
		console.log("", error);
	}
});

module.exports = router;
