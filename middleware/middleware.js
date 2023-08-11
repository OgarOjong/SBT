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
		return res.redirect("./auth/login");
	}
	next();
};

exports.disableCaching = (req, res, next) => {
	res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
	next();
};

//module.exports = isLoggedIn;
