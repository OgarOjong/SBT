const express = require("express");
const router = express.Router({ mergeParams: true });
const Campground = require("../model/campground");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const { CampgroundSchema, reviewSchema } = require("../utils/schemas");
const flash = require("connect-flash");
const { upload, getBanks, updateFile } = require("../services/upload");
const multer = require("multer");
const path = require("path");
const { getFiles, getSingleFile } = require("../services/files");
const { signin, register } = require("../services/auth");
const passport = require("passport");
const ObjectID = require("mongoose").Types.ObjectId;
const { isLoggedIn, disableCaching } = require("../middleware/middleware");

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
	"/auth/login",
	catchAsync(async (req, res) => {
		res.render("uploader/auth");
	})
);

router.post(
	"/auth/login",
	passport.authenticate("local", {
		failureFlash: true,
		failureRedirect: "/uploader/auth/login",
	}),
	catchAsync(async (req, res) => {
		console.log("Route HIT POST LOGIN");
		req.flash("success", "welcome back");
		res.redirect("/uploader/index");
		/*let { email, password } = req.body;
		await signin({ email, password });
		res.redirect("./upload");
		*/
	})
);

router.get("/auth/logout", (req, res) => {
	console.log("Checking the route");
	req.logout(function (err) {
		if (err) {
			console.log("Error from logout route:", err);
			return next(err);
		}
		console.log("Sucessful Logout");
		req.flash("success", "Goodbye!");
		res.redirect("/uploader/auth/login");
	});
});

router.get(
	"/admin",
	disableCaching,
	isLoggedIn,
	catchAsync(async (req, res) => {
		res.render("uploader/admin", {
			messages: {
				error: req.flash("reg_error"),
				success: req.flash("reg_success"),
			},
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
		req.flash("reg_success", "User Registered Successfuly");
		console.log("Registration Status: ", newUser);
		res.redirect("./admin");
		// res.render("uploader/admin", {});
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
		});
	})
);

router.get(
	"/upload",
	disableCaching,
	isLoggedIn,
	catchAsync(async (req, res) => {
		const banks = getBanks();
		res.render("uploader/upload", {
			messages: {
				error: req.flash("file_error"),
				success: req.flash("file_success"),
			},
			banks,
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
	catchAsync(async (req, res) => {
		const files = await getFiles();
		res.render("uploader/filelist", { files });
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
		res.render("uploader/file", { file, headers, file_id });
	})
);

router.post(
	"/submit-renew-form",
	catchAsync(async (req, res) => {
		console.log("inside the modal rebdy", req.body);
		await updateFile(req.body);
		res.redirect(`./${req.body.file_id}`);
	})
);

module.exports = router;
