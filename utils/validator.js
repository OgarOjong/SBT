const Joi = require("joi");

const acountidValidation = Joi.object({
	customer_id: Joi.string().required(),
	bank: Joi.string().required(),
	renew_id: Joi.string().required(),
	file_id: Joi.string().required(),
	data_ref: Joi.string().required(),
	paymentchannel: Joi.string().required(),
	bank: Joi.string().required(),
	location: Joi.string().required(),
	Deposit: Joi.string().optional().allow(""),
	Credit: Joi.string().optional().allow(""),
	login: Joi.string().optional(),
});

module.exports = {
	acountidValidation: (req, res, next) => {
		const { error } = acountidValidation.validate(req.body);
		if (error) {
			//console.log(error);
			//const msg = error.details[0].message
			const msg = error.details.map((el) => el.message).join(",");
			req.flash("error", msg);
			console.log("in the validator", req.body);
			return res.redirect("/uploader/filelist");
			console.log(error);
			//return next(new ExpressError(400, msg, false, true, {}));
		}
		next();
	},
};
