const express = require("express");
const router = express.Router({ mergeParams: true });
const Campground = require("../model/campground");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const { CampgroundSchema, reviewSchema } = require("../utils/schemas");

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

router.get(
	"/",
	catchAsync(async (req, res) => {
		const campgrounds = await Campground.find({});
		//res.status(201).send(campgrounds);
		res.render("campground/index", { campgrounds });

		// res.status(200).send(campgrounds);
	})
);

router.get("/new", (req, res) => {
	res.render("campground/new");
});

router.post(
	"/",
	validateCampground,
	catchAsync(async (req, res) => {
		if (!req.body.campground) throw new ExpressError("Invalid request", 300);
		const camp = new Campground(req.body.campground);
		await camp.save();
		res.redirect(`campgrounds/${camp._id}`);
	})
);

router.get(
	"/:id",
	catchAsync(async (req, res) => {
		const { id } = req.params;
		// console.log(id);
		const campground = await Campground.findById(id).populate("reviews");
		console.log(campground);
		console.log("This is where the error emits");
		res.render("campground/show", { campground });
	})
);

router.get(
	"/:id/edit",
	catchAsync(async (req, res, next) => {
		try {
			const { id } = req.params;
			// console.log(id);
			const campground = await Campground.findById(id);
			// console.log(campground);
			res.render("campground/edit", { campground });
		} catch (error) {
			//console.log("From ID route");
			console.log(error);
		}
	})
);

router.put(
	"/:id",
	validateCampground,
	catchAsync(async (req, res) => {
		const { id } = req.params;
		const updateCamp = await Campground.findByIdAndUpdate(
			id,
			{ ...req.body.campground },
			{ new: true }
		);
		//console.log({ ...req.body.campground });
		//console.log(updateCamp);
		res.redirect(`/campgrounds/${updateCamp._id}`);
		//res.send("IT WORKED")
	})
);

router.delete(
	"/:id",
	catchAsync(async (req, res) => {
		const { id } = req.params;
		console.log(id);
		const deletedCamp = await Campground.findByIdAndDelete(id);
		console.log(deletedCamp);
		res.redirect(`/campgrounds`);
	})
);

module.exports = router;
