const mongoose = require("mongoose");
const Review = require("../model/review");
const Schema = mongoose.Schema;

const CampgroundSchema = new Schema({
	title: String,
	price: Number,
	image: String,
	description: String,
	location: String,
	reviews: [
		{
			type: Schema.Types.ObjectId,
			ref: "Review",
		},
	],
});
//Delete associated reviews if a campground is deleted.
//This code gets the deleted document (in doc) and deleted the associated reviews from Review collection
CampgroundSchema.post("findOneAndDelete", async function (doc) {
	console.log(doc);
	if (doc) {
		await Review.deleteMany({
			_id: {
				$in: doc.reviews,
			},
		});
	}
});

module.exports = mongoose.model("Campground", CampgroundSchema);
