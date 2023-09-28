const express = require("express");
const router = express.Router({ mergeParams: true });
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const flash = require("connect-flash");
const { upload, findDealerbyDate } = require("../services/jaraUpload");
const multer = require("multer");
const path = require("path");
const { smsFile, smsService } = require("../services/jarasmsdetails");
const ObjectID = require("mongoose").Types.ObjectId;
const {
	isLoggedIn,
	disableCaching,
	roleManager,
} = require("../middleware/middleware");
const JaraFiles = require("../model/jara");

const multerUpload = multer({
	storage: multer.diskStorage({}),
	limits: { fileSize: 1024 * 1024 * 10000 },
	fileFilter: (req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		console.log({ ext });
		if (ext !== ".csv") {
			cb(null, false);
		}
		cb(null, true);
	},
});

router.get("/upload", isLoggedIn, disableCaching, (req, res) => {
	console.log("Here fon jara get route");
	/*	return res.render("uploader/jara", {
			user: req?.user,
			messages: {
				error: req.flash("file_error"),
				success: req.flash("file_success"),
			},
			}); */
	res.render("jara/jara", { user: req?.user });
});

router.post(
	"/upload",
	isLoggedIn,
	//	roleManager,
	multerUpload.single("upload"),
	async (req, res) => {
		console.log("the req body from jara upload", req.body);
		if (!req.file) {
			req.flash("error", "Please select a csv file to continue");
			return res.redirect("./upload");
		} else if (req.file.mimetype !== "text/csv") {
			req.flash("error", "Only .csv file is allowed");
			return res.redirect("./upload");
		} else if (!req.body.dated) {
			req.flash("error", "Please add a date to continue");
			return res.redirect("./upload");
		}

		const isDuplicateUpload = await JaraFiles.findOne({
			profiledDate: req.body.dated,
		});
		//console.log(isDuplicateUpload);
		if (isDuplicateUpload) {
			req.flash("error", "Cannot Upload Multiple records for the same Day");
			return res.redirect("./upload");
		}
		const up = await upload(req);
		if (!up.okay) {
			console.log("Up Debugging", up.message);
		}
		if (up.ok === true) {
			console.log("Debugging", up);
			let data_jara_for_sms = await smsFile(req.body.dated);
			let smsSentStatus = await smsService(data_jara_for_sms, req.body.dated);
			//console.log("the jara sms data", data_jara_for_sms);
			//after this send the array to the sms service for trigering
			req.flash("success", "File upload successful");
			return res.redirect("./upload");
		}
		req.flash("error", up.message);
		console.log("jara upload", up);
		return res.redirect("./upload");
	}
);

router.get("/dealer", (req, res) => {
	let newDealerResult = {};
	res.render("jara/jaradealer", { newDealerResult });
});

router.post("/dealer", async (req, res) => {
	const { dated, dealercode } = req.body;
	if (!req.body || !dated || !dealercode) {
		req.flash("error", "Please input all values");
		return res.redirect("/jara/dealer");
	}
	const isNotDated = await JaraFiles.findOne({
		profiledDate: req.body.dated,
	});
	if (!isNotDated) {
		req.flash("error", "No Jara record for the specified date");
		return res.redirect("/jara/dealer");
	}

	let dealerResult = await findDealerbyDate(req.body);
	if (dealerResult.ok === true) {
		let m = dealerResult.message;
		let {
			DEALER,
			Count_of_allocated_Customers,
			All_RENEWAL,
			RENEWAL_BY_PERCENT,
			RANK,
		} = m[0].csv;

		// Declare newDealerResult here
		let newDealerResult = {
			DEALER,
			RENEWAL_BY_PERCENT,
			RANK,
			Count_of_allocated_Customers,
		};

		return res.render("jara/jaradealer", { newDealerResult });
	}

	return res.render("jara/jaradealer");
});

module.exports = router;
