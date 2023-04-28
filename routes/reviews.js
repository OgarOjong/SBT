const express = require("express");
const router = express.Router({ mergeParams: true });
const Campground = require("../model/campground");
const Review = require("../model/review");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const { reviewSchema } = require("../utils/schemas");

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

router.post(
	"/",
	validateReview,
	catchAsync(async (req, res) => {
		//const {} = req.body;
		const { id } = req.params;
		//console.log(id);
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

router.delete(
	"/:reviewId",
	catchAsync(async (req, res) => {
		const { id, reviewId } = req.params;
		//The pull oerator is used here to delete an item from the array in a document
		await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
		await Review.findByIdAndDelete(reviewId);
		res.redirect(`/campgrounds/${id}`);
	})
);

module.exports = router;
