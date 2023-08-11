const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../model/user");
const { getUserByEmail, getUserByEmailAndPassword } = require("./users");

exports.register = async (payload) => {
	const { name, email, password, role } = payload;
	let status = { ok: true, mesaag: "" };
	let checkUser = await getUserByEmail(email);
	if (checkUser) {
		return (status = {
			ok: false,
			message: "User already exist with the email",
		});
	}
	const user = new User({
		name,
		email,
		role,
	});
	console.log("Register Payload: ", payload);
	const registeredUser = await User.register(user, password);
	return (status = { ok: true, message: "user registered successfully" });
};

exports.signin = async (payload) => {
	console.log("about to login");
	const { email, password } = payload;
	const user = await getUserByEmail(email);
	console.log("the actual user:", user);
	if (!user) return { ok: false, message: "Invalid Credentials" };

	passport.use(
		new LocalStrategy(async (email, password, done) => {
			const login_valid = await getUserByEmailAndPassword(email, password);
			console.log("the actual user with password", login_valid);
			if (login_valid) return done(null, login_valid);
			else return done(null, false, { message: "Invalid Credentials" });
		})
	);
	passport.authenticate("local", {
		successRedirect: "./index",
		failureMessage: "./login",
		failureFlash: true,
	});
};
