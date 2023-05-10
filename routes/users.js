const express = require("express");
const router = express.Router();
const User = require("../model/user");
const catchAsync = require("../utils/catchAsync");
const passport = require("passport");

router.get("/register", (req, res) => {
	res.render("users/register");
});

router.post(
	"/register",
	catchAsync(async (req, res) => {
		try {
			const { username, email, password } = req.body;
			const user = new User({
				username,
				email,
			});
			console.log(req.body);
			const registeredUser = await User.register(user, password);
			console.log(registeredUser);
			req.flash("success", "welcome to yelpcamp");
			res.redirect("/login");
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
	passport.authenticate("local", {
		failureFlash: true,
		failureRedirect: "/users/login",
	}),
	(req, res) => {
		req.flash("success", "welcome back to campgrounds");
		res.redirect("/campgrounds");
	}
);

module.exports = router;
