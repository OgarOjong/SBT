const express = require("express");
const router = express.Router();
const User = require("../model/user");
const catchAsync = require("../utils/catchAsync");
const passport = require("passport");
const storeReturnTo = require("../middleware/middleware");

router.get("/register", (req, res) => {
	res.render("users/register");
});

router.post(
	"/register",
	catchAsync(async (req, res, next) => {
		try {
			const { username, email, password } = req.body;
			const user = new User({
				username,
				email,
			});
			console.log(req.body);
			const registeredUser = await User.register(user, password);
			//console.log(registeredUser);
			req.login(registeredUser, (err) => {
				if (err) return next(err);
				req.flash("success", "welcome to yelpcamp");
				res.redirect("/campgrounds");
			});
		} catch (err) {
			req.flash("error", err.message);
			res.redirect("/register");
		}
	})
);

router.get("/login", (rq, res) => {
	res.render("users/login");
});

router.post(
	"/login",
	//storeReturnTo,
	passport.authenticate("local", {
		failureFlash: true,
		failureRedirect: "/users/login",
	}),
	(req, res) => {
		const redirectUrl = res.locals.returnTo || "/campgrounds";
		//delete req.session.retunTo;
		console.log("Here is the login route");
		req.flash("success", "welcome back to campgrounds");
		res.redirect("/campgrounds");
		//res.redirect(redirectUrl);
	}
);

router.get("/logout", (req, res) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		req.flash("success", "Goodbye!");
		res.redirect("/campgrounds");
	});
});

module.exports = router;
