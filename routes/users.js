const express = require("express");
const router = express.Router();
const User = require("../model/user");
const catchAsync = require("../utils/catchAsync");
const passport = require("passport");
const mongoose = require("mongoose");
const storeReturnTo = require("../middleware/middleware");
const EmailSender = require("../services/email");
const { generateToken } = require("../utils/tokenGenerator");
const { isLoggedIn, disableCaching } = require("../middleware/middleware");

router.get("/login", (req, res) => {
	res.render("users/login");
});

router.post(
	"/login",
	passport.authenticate("local", {
		failureFlash: true,
		failureRedirect: "/users/login",
	}),
	catchAsync(async (req, res) => {
		console.log("Route HIT POST LOGIN");
		req.flash("success", "welcome back");
		return res.redirect("/uploader/index");
	})
);

router.get("/reset", isLoggedIn, disableCaching, (req, res) => {
	return res.render("users/reset", { user: req?.user });
});

router.post("/reset", isLoggedIn, disableCaching, async (req, res) => {
	const { password, newpassword, confirmpassword } = req.body;
	let { email } = req?.user;
	let user = await User.findOne({ email });
	if (!user) {
		req.flash("error", "Fraudulent password attempt");
		return res.redirect("/users/reset");
	}
	// Compare currentPassword with the hashed password in the database
	const passwordMatch = await user.authenticate(password);
	if (passwordMatch.user === false) {
		req.flash("error", "Please input the correct password");
		return res.redirect("/users/reset");
	}
	if (newpassword !== confirmpassword) {
		req.flash("error", "New Password does not match confirmed password");
		return res.redirect("/users/reset");
	}
	await user.setPassword(newpassword);
	user.passwordResetCount += 1;
	user.save();
	req.flash("success", "password reset successful");
	return res.redirect("/users/login");
});

router.get("/logout", isLoggedIn, (req, res) => {
	console.log("Checking the route");
	req.logout(function (err) {
		if (err) {
			console.log("Error from logout route:", err);
			return next(err);
		}
		console.log("Sucessful Logout");
		req.flash("success", "Goodbye!");
		return res.redirect("/users/login");
	});
});

router.get("/forgot", (req, res) => {
	res.render("users/forgotemail", {});
});

router.post(
	"/forgot",
	catchAsync(async (req, res) => {
		const { emails } = req.body;
		if (!emails) {
			req.flash("error", "Please enter an email");
			return res.redirect("/users/forgot");
		}
		try {
			const user = await User.findOne({ email: emails });
			if (!user) {
				req.flash("error", "user is not valid");
				return res.redirect("/users/forgot");
			}
			const { name, email } = user;
			let toks = await generateToken();
			user.resetPasswordToken = toks;
			//180000 -- 3600000
			user.resetExpires = Date.now() + 3600000;
			user.save();

			let httpProtocole = req.secure ? "https" : "http";
			const resetLink = `${httpProtocole}://${req.headers.host}/users/forgot/${toks}`;
			console.log("the reset link ", resetLink);

			let mailer = new EmailSender(
				email,
				"SBT PASSWORD RESET",
				`Please click the link ${resetLink} to reset password  the below to reset your password`,
				name
			);
			let emailRes = await mailer.sendEmail();
			console.log("Email Response", emailRes);
			req.flash("success", "Reset Link sent to user email");
			return res.redirect("/users/forgot");
		} catch (err) {
			console.log(err);
		}
	})
);

router.get("/forgot/:token", async (req, res) => {
	const { token } = req.params;
	const tokenUser = await User.findOne({ resetPasswordToken: token });
	if (!tokenUser) {
		console.log("user is invalid");
		req.flash("error", "token is invlaid");
		return res.redirect("/users/forgot");
	}
	//const tokenExpirationTime = Date.parse(resetExpires); // Convert ISO string to timestamp
	//check if the link is expired
	const tokenTimeCheck = await User.findOne({
		resetPasswordToken: token,
		resetExpires: { $gt: Date.now() },
	});
	if (!tokenTimeCheck) {
		req.flash("error", "Expired Token");
		return res.redirect("/users/forgot");
	}
	return res.render("users/forgot", { token });
});
router.post("/forgot/:token", async (req, res) => {
	const { token } = req.params;
	const { password, confirmpassword } = req.body;
	const tokenTimeCheck = await User.findOne({
		resetPasswordToken: token,
		resetExpires: { $gt: Date.now() },
	});
	if (!tokenTimeCheck) {
		req.flash("error", "Expired Token");
		return res.redirect("/users/forgot");
	}
	if (confirmpassword !== password) {
		req.flash("error", "Password does not match");
		return res.redirect(`/users/forgot/${token}`);
	}
	try {
		const setPasswordResult = await tokenTimeCheck.setPassword(password);
		tokenTimeCheck.resetExpires = undefined;
		tokenTimeCheck.resetPasswordToken = undefined;
		await tokenTimeCheck.save();
		req.flash("success", "password reset successful");
		res.redirect("/users/login");
	} catch (e) {
		console.log(e);
	}
});
module.exports = router;
