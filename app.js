const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOveride = require("method-override");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
require("dotenv").config();
const { CampgroundSchema, reviewSchema } = require("./utils/schemas");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const Joi = require("joi");

const app = express();
const Campground = require("./model/campround");
const Review = require("./model/review");
const { json } = require("express");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOveride("_method"));
app.use(morgan("dev"));

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

const validateCampground = (req, res, next) => {
	const { error } = CampgroundSchema.validate(req.body);
	//console.log(error);
	if (error) {
		//const msg2 = error.details[0].message;
		const msg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(msg, 400);
	} else {
		next();
	}
};

const validateReview = (req, res, next) => {
	const { error } = reviewSchema.validate(req.body);
	if (error) {
		const msg2 = error.details[0].message;
		const msg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(msg, 400);
		console.log(error);
	} else {
		console.log("Passed through");
		next();
	}
};

app.get("/", (req, res) => {
	res.render("home");
});

app.get(
	"/campgrounds",
	catchAsync(async (req, res) => {
		const campgrounds = await Campground.find({});
		//res.status(201).send(campgrounds);
		res.render("campground/index", { campgrounds });

		// res.status(200).send(campgrounds);
	})
);

app.get("/campgrounds/new", (req, res) => {
	res.render("campground/new");
});

app.post(
	"/campgrounds",
	validateCampground,
	catchAsync(async (req, res) => {
		if (!req.body.campground) throw new ExpressError("Invalid request", 300);
		const camp = new Campground(req.body.campground);
		await camp.save();
		res.redirect(`campgrounds/${camp._id}`);
	})
);

app.get(
	"/campgrounds/:id",
	catchAsync(async (req, res) => {
		const { id } = req.params;
		// console.log(id);
		const campground = await Campground.findById(id).populate("reviews");
		console.log(campground);
		res.render("campground/show", { campground });
	})
);

app.get(
	"/campgrounds/:id/edit",
	catchAsync(async (req, res) => {
		try {
			const { id } = req.params;
			// console.log(id);
			const campground = await Campground.findById(id);
			// console.log(campground);
			res.render("campground/edit", { campground });
		} catch (error) {
			console.log("From ID route");
			console.log(error);
		}
	})
);

app.put(
	"/campgrounds/:id",
	validateCampground,
	catchAsync(async (req, res) => {
		const { id } = req.params;
		const updateCamp = await Campground.findByIdAndUpdate(
			id,
			{ ...req.body.campground },
			{ new: true }
		);
		console.log({ ...req.body.campground });
		console.log(updateCamp);
		res.redirect(`/campgrounds/${updateCamp._id}`);
		//res.send("IT WORKED")
	})
);

app.delete(
	"/campgrounds/:id",
	catchAsync(async (req, res) => {
		const { id } = req.params;
		console.log(id);
		const deletedCamp = await Campground.findByIdAndDelete(id);
		console.log(deletedCamp);
		res.redirect(`/campgrounds`);
	})
);

app.post(
	"/campgrounds/:id/reviews",
	validateReview,
	catchAsync(async (req, res) => {
		//const {} = req.body;
		const { id } = req.params;
		console.log(id);
		const campground = await Campground.findById(id);
		const review = new Review(req.body.review);
		await review.save();
		campground.reviews.push(review);
		await campground.save();
		res.redirect(`/campgrounds/${campground.id}`);
		//res.send(review);

		//campground.review =
	})
);

app.delete(
	"/campgrounds/:id/reviews/:reviewId",
	catchAsync(async (req, res) => {
		const { id, reviewId } = req.params;
		//The pull oerator is used here to delete an item from the array in a document
		await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
		await Review.findByIdAndDelete(reviewId);
		res.redirect(`/campgrounds/${id}`);
	})
);
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
