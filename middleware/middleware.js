const { ROLES } = require("../configs/roles");
const { findTransaction } = require("../services/upload");
module.exports.storeReturnTo = (req, res, next) => {
	if (req.session.returnTo) {
		res.locals.returnTo = req.session.returnTo;
	}
	next();
};

exports.isLoggedIn = (req, res, next) => {
	//console.log("fROM THE isLoggedIn middleware", req.user);
	res.locals.currentUser = req.user;
	if (!req.isAuthenticated()) {
		req.flash("error", "You need to login first");
		req.session.returnTo = req.originalUrl;
		console.log("The req.session retun to req", req.session.returnTo);
		//console.log("from the isloggedIn middleware orgUrl:", req.originalUrl);
		//console.log("from the isloggedIn middleware path:", req.path);
		return res.redirect("/users/login");
	}
	next();
};

exports.disableCaching = (req, res, next) => {
	res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
	next();
};

exports.roleManager = (req, res, next) => {
	const path = req.path;
	const user = req.user;
	const role = ROLES.find((r) => r.role === user.role);
	//console.log({ user, role });

	if (role.allowed_path.includes(path) || role.allowed_path[0] === "*") next();
	else {
		req.flash("error", "Access denied");
		req.session.returnTo = req.originalUrl;
		return res.redirect("./index");
	}
};

exports.transactionUpdateStatus = async (req, res, next) => {
	const { bank, data_ref } = req.body;
	let transactionUpdateStatus = await findTransaction(bank, data_ref);
	console.log(
		"null status of the status",
		transactionUpdateStatus.data.csv.status
	);

	if (transactionUpdateStatus.data.csv.status === "") {
		next();
	} else {
		console.log("it is not null don't continue");
		req.flash(
			"error",
			"The data has been updated please pick another transaction"
		);
		return res.redirect(`/uploader/${bank}/pendings/`);
	}
};

//module.exports = isLoggedIn;
