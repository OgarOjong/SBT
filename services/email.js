const hbs = require("nodemailer-express-handlebars");
const nodemailer = require("nodemailer");
const path = require("path");
const { logger } = require("../utils/logger");
//const ExpressError = require("../utils/expressError");

class EmailSender {
	constructor(email, subject, text, name) {
		this.email = email;
		this.subject = subject;
		this.text = text;
		this.name = name;
	}

	async sendEmail() {
		try {
			const transporter = await nodemailer.createTransport({
				host: process.env.EMAILHOST,
				port: 2522,
				auth: {
					user: process.env.EMAILUSER,
					pass: process.env.EMAILPASSWORD,
				},
			});
			console.log("transport", transporter);
			const mailOptions = {
				from: "itadmin@spectranet.com.ng",
				to: this.email,
				subject: this.subject,
				//  bcc: ["emmanuel.ojong@spectranet.com.ng", "billing@spectranet.com.ng"],
				//template: "emailtemplate",
				context: {
					username: this.name,
					message: this.text,
				},
			};
			console.log("mailoptions", mailOptions);
			transporter.sendMail(mailOptions, async (error, info) => {
				if (error) {
					logger.error("email sending error", error);
					console.log(error);
					console.log(`Email failed to send to ${this.email}`);
				} else {
					// logger.info(info);
					const { accepted, rejected, messageId, response } = info;
					//logger.info(response);
					console.log(messageId);
					console.log(`Email successfully sent to ${this.email}`);
				}
			});
		} catch (error) {
			throw error;
		}
	}
}

module.exports = EmailSender;
