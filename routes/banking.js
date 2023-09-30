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

router.get("/", roleManager, disableCaching, isLoggedIn, (req, res) => {
	res.render("banking/index", {
		user: req?.user,
	});
});

module.exports = router;
