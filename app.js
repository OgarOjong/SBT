const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOveride = require("method-override");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
require("dotenv").config();
const session = require("express-session");
const flash = require("connect-flash");
//const { CampgroundSchema, reviewSchema } = require("./utils/schemas");
//const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const Joi = require("joi");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./model/user");

const app = express();
//const Campground = require("./model/campground");
//const Review = require("./model/review");
const { json } = require("express");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOveride("_method"));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

const sessionConfig = {
	secret: "thisshouldbeasecret",
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7,
	},
};

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const CampgroundsRoute = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

const MONGODB_URI = `mongodb://127.0.0.1:${process.env.DBport}/yelp-camp`;
mongoose
	.connect(MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log(`Database Connection Established on port`);
	})
	.catch((err) => {
		console.log(`Connection Error`);
		console.log(err);
	});

app.use((req, res, next) => {
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	next();
});
app.use("/campgrounds", CampgroundsRoute);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
	res.render("home");
});

app.all("*", (req, res, next) => {
	next(new ExpressError("PAGE NOT FOUND!!", 404));
});

app.use((err, req, res, next) => {
	const { message = "Something Went Wrong!!", statusCode = 500 } = err;
	if (!err.message) err.message = "Oh no something went wrong";
	res.status(statusCode).render("error", { err });
});

app.listen(3002, () => {
	console.log(`Servin on port 3002`);
});
