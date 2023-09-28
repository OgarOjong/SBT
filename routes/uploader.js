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
} = require("../services/upload");
const multer = require("multer");
const path = require("path");
const {
	getFiles,
	getSingleFile,
	archiveSingleFile,
} = require("../services/files");
const { signin, register } = require("../services/auth");
const passport = require("passport");
const ObjectID = require("mongoose").Types.ObjectId;
const {
	isLoggedIn,
	disableCaching,
	roleManager,
	transactionUpdateStatus,
} = require("../middleware/middleware");
const { acountidValidation } = require("../utils/validator");
const ConvalenceCallService = require("../utils/covalenceReq");
const {
	customerVerification,
	covalencepayment,
} = require("../services/useridverification");
const {
	getBankFiles,
	getBankFilesByUpdate,
} = require("../services/bankValidator");
const { logger } = require("../utils/logger");
const { object } = require("joi");
//const bankConfig = require("../configs/banks");

const multerUpload = multer({
	storage: multer.diskStorage({}),
	limits: { fileSize: 1024 * 1024 * 10000 },
	fileFilter: (req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		//console.log({ ext });
		if (ext !== ".csv") {
			cb(null, false);
		}
		cb(null, true);
	},
});

router.get(
	"/admin",
	roleManager,
	disableCaching,
	isLoggedIn,
	catchAsync(async (req, res) => {
		res.render("uploader/admin", {
			messages: {
				error: req.flash("reg_error"),
				success: req.flash("reg_success"),
			},
			user: req?.user,
		});
	})
);

//Register User
router.post(
	"/admin",
	disableCaching,
	isLoggedIn,
	catchAsync(async (req, res) => {
		if (!req.body) {
			req.flash("reg_error", "Please fill in data for new registration");
		}
		let newUser = await register(req.body);
		if (!newUser.ok) {
			req.flash("reg_error", newUser.message);
			return res.redirect("./admin");
		}

		req.flash("reg_success", "User Registered Successfuly");
		console.log("Registration Status: ", newUser);
		res.redirect("./admin");
		// res.render("uploader/admin", {});
	})
);

router.get("/bankfile", disableCaching, isLoggedIn, async (req, res) => {
	const banks = await getBankFiles();
	res.render("uploader/bankfile", { user: req?.user, banks });
});

router.get(
	"/:bankname/:update",
	disableCaching,
	isLoggedIn,
	catchAsync(async (req, res) => {
		let { bankname, update } = req.params;
		//console.log(req.params);
		try {
			let bank = await getBankFilesByUpdate(bankname, update);
			let dataToUpdate = update === "updateds" ? bank.updated : bank.pending;
			if (dataToUpdate && dataToUpdate.length > 0) {
				let headers = Object.keys(dataToUpdate[0].csv);
				//console.log("Bank looping", dataToUpdate);
				res.render("uploader/filebybank", {
					user: req?.user,
					headers,
					bank,
					update,
					dataToUpdate,
				});
			} else {
				console.log("No data found for the selected update type.");
			}
		} catch (err) {
			console.log(err);
		}
	})
);

router.get(
	"/index",
	disableCaching,
	isLoggedIn,
	catchAsync(async (req, res) => {
		res.render("uploader/index", {
			messages: {
				error: req.flash("error"),
				success: req.flash("success"),
			},
			user: req?.user,
		});
	})
);

router.get(
	"/upload",
	disableCaching,
	isLoggedIn,
	roleManager,
	catchAsync(async (req, res) => {
		const banks = getBanks();
		res.render("uploader/upload", {
			messages: {
				error: req.flash("file_error"),
				success: req.flash("file_success"),
			},
			banks,
			user: req?.user,
		});
	})
);

router.post(
	"/upload",
	isLoggedIn,
	multerUpload.single("upload"),
	catchAsync(async (req, res) => {
		if (!req.file) {
			req.flash("file_error", "Please select a csv file to continue");
			return res.redirect("./upload");
		} else if (req.file.mimetype !== "text/csv") {
			req.flash("file_error", "Only .csv file is allowed");
			return res.redirect("./upload");
		}
		let user = req.user;
		const up = await upload(req);
		//console.log("req", req);
		if (!up.ok) {
			req.flash("file_error", up.message);
			return res.redirect("./upload");
		}
		req.flash("file_success", up.message);
		res.redirect("./upload");
	})
);

router.get(
	"/filelist",
	disableCaching,
	isLoggedIn,
	roleManager,
	catchAsync(async (req, res) => {
		const files = await getFiles();
		//console.log("the files:", files);
		res.render("uploader/filelist", { files, user: req?.user });
	})
);

router.get(
	"/file/archive/:fileId",
	catchAsync(async (req, res) => {
		const file_id = req.params.fileId;
		console.log("Archival fileID", file_id);
		if (!ObjectID.isValid(file_id)) {
			console.log("inside an error fileID", file_id);
			logger.info(`wrongfileId hit on filearchive: ${file_id}`);
			req.flash("error", "Invalid filelist ID please contact admin");
			return res.redirect("/uploader/filelist");
		}
		const file = await archiveSingleFile(file_id);
		//console.log("Archival file status", file);
		req.flash(file.ok ? "success" : "error", file.message);
		return res.redirect("/uploader/filelist");
	})
);

router.get(
	"/:fileId",
	disableCaching,
	isLoggedIn,
	catchAsync(async (req, res) => {
		const file_id = req.params.fileId;
		console.log("the file ID", file_id);
		if (!ObjectID.isValid(file_id)) {
			console.log("inside an error fileID", file_id);
			req.flash("error", "Invalid filelist ID please contact admin");
			return res.redirect("/uploader/filelist");
		}
		const file = await getSingleFile(file_id);
		const headers = Object.keys(file.csv[0]); // can be any index but it's safe to use the first index
		res.render("uploader/file", { file, headers, file_id, user: req?.user });
	})
);

//Bankwise refill  post route
router.post(
	"/:bank/submit-renew-form",
	isLoggedIn,
	acountidValidation,
	transactionUpdateStatus,
	catchAsync(async (req, res) => {
		const renewer = res.locals.currentUser;
		//pass req.user
		//console.log("the url", req.url);
		let {
			customer_id,
			paymentchannel,
			file_id,
			data_ref,
			Deposit,
			Credit,
			bank,
			location,
		} = req.body;
		customer_id = customer_id.trim();
		const amount = Deposit || Credit;
		const updater = renewer?.name;
		const updaters = renewer?.name.split(" ");

		if (paymentchannel === "covalence") {
			try {
				const customer = await customerVerification(customer_id);
				console.log("customer notification", customer);
				console.log("Amount Depoited", amount);
				const depositAmount = amount.replace(/,/g, "").replace(/^[^0-9]+/, "");
				const concatenatedString = bank.replace(/\s+/g, "");

				if (!customer.ok) {
					req.flash("error", "Please check the customer ID");
					return res.redirect(`/uploader/${bank}/pendings/`);
				}
				let { ok, payload } = customer;
				let { custReference } = payload;

				const paymentNotifier = await covalencepayment(
					customer_id,
					data_ref,
					parseInt(depositAmount),
					concatenatedString,
					updaters[0]
				);
				console.log("Amount", parseInt(depositAmount));
				console.log(`payment notifier: ${paymentNotifier}`);

				if (!paymentNotifier.ok) {
					req.flash("error", paymentNotifier.payload);
					logger.info(
						`initiator:${updater}--errorInfo:${paymentNotifier.payload}--${paymentNotifier.ok}`
					);
					return res.redirect(`/uploader/${bank}/pendings/`);
				}
				logger.info(
					`initiator:${updater}--Amount:${depositAmount}--Info:${paymentNotifier.payload}--${paymentNotifier.ok}`
				);
				const updateValue = await updateFile({
					data_ref,
					paymentchannel,
					customer_id,
					updater,
					file_id,
					depositAmount,
				});
				req.flash("success", paymentNotifier.payload);
				return res.redirect(`/uploader/${bank}/pendings/`);
			} catch (error) {
				logger.error(`update error: ${error}`);
				console.error("Error during Covalence payment:", error);
				req.flash("error", "An error occurred while processing the payment.");
				return res.redirect(`/uploader/${bank}/pendings/`);
			}
		} else {
			// Handle other payment channels or scenarios here if needed
			const updateValue = await updateFile({
				data_ref,
				paymentchannel,
				customer_id,
				updater,
				file_id,
				//	depositAmount,
			});
			req.flash("success", "Updated Successfully");
			return res.redirect(`/uploader/${bank}/pendings/`);
		}
	})
);

router.post(
	"/submit-renew-form",
	acountidValidation,
	catchAsync(async (req, res) => {
		const renewer = res.locals.currentUser;

		let {
			customer_id,
			paymentchannel,
			file_id,
			data_ref,
			Deposit,
			Credit,
			bank,
			location,
		} = req.body;
		customer_id = customer_id?.trim();
		//console.log("submiting req", req.body);
		const amount = Deposit || Credit;
		const updater = renewer?.email;
		const updaters = renewer?.name.split(" ");
		const depositAmount = amount
			.replace(/[^0-9]/g, "")
			.replace(/,/g, "")
			.replace(/\.0+$/, "")
			.replace(/\s+/g, "");
		console.log("checking for deposited", depositAmount);

		const concatenatedString = bank.replace(/\s+/g, "");
		if (paymentchannel === "covalence") {
			try {
				const customer = await customerVerification(customer_id);

				if (!customer.ok) {
					req.flash("error", "Please check the customer ID");
					return res.redirect(`./${file_id}`);
				}

				//const characterCheck = concatenatedString.replace(/\D/g, "");

				const paymentNotifier = await covalencepayment(
					customer_id,
					data_ref,
					parseInt(depositAmount),
					concatenatedString,
					updaters[0]
				);
				console.log("paymentNoifier", paymentNotifier);
				if (!paymentNotifier.ok) {
					logger.info(
						`initiator:${updater}--Amount:${parseInt(
							depositAmount
						)}--errorInfo:${paymentNotifier.payload}--${paymentNotifier.ok}`
					);
					req.flash("error", paymentNotifier.payload);
					return res.redirect(`./${file_id}`);
				}

				logger.info(
					`initiator:${updater}--Amount:${depositAmount}--Info:${paymentNotifier.payload}--${paymentNotifier.ok}`
				);
				const updateValue = await updateFile({
					data_ref,
					paymentchannel,
					customer_id,
					updater,
					file_id,
					depositAmount,
				});
				req.flash("success", paymentNotifier.payload);
				return res.redirect(`./${file_id}`);
			} catch (error) {
				console.error("Error during Covalence payment:", error);
				req.flash("error", "An error occurred while processing the payment.");
				return res.redirect(`./${file_id}`);
			}
		} else {
			// Handle other payment channels or scenarios here if needed
			const updateValue = await updateFile({
				data_ref,
				paymentchannel,
				customer_id,
				updater,
				file_id,
				depositAmount,
			});

			req.flash("success", "Updated Successfully");
			return res.redirect(`./${file_id}`);
		}
	})
);

module.exports = router;
