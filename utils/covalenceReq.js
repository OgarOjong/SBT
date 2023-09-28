const axios = require("axios");
const { logger } = require("../utils/logger");
const config = require("../configs/index");
//const { ExpressError } = require("../utils/expressError");

class ConvalenceCallService {
	constructor() {
		this.auth = {
			username: process.env.ALEPO_USERNAME,
			password: process.env.ALEPO_PASSWORD,
		};
	}

	async token() {
		console.log("covalence token");
		const options = {
			method: "POST",
			url: config.COVALENSE.siginURL,
			headers: { "Content-Type": "application/json" },
			data: {
				usernameOrEmail: config.COVALENSE.usernameOrEmail,
				password: config.COVALENSE.password,
			},
		};
		try {
			const response = await axios.request(options);
			const { accessToken, tokenType } = response.data;

			return { accessToken, tokenType };
		} catch (error) {
			logger.error(error);
			//console.log(error);
		}
	}

	async makeCall(method, url, data, source) {
		try {
			const auth = await this.token();
			// const reqUser = res.locals.currentUser;
			//   console.log("From covalence make call",reqUser.bankName);

			const options = {
				method,
				url,
				headers: {
					source: "BANKPAYMENTONLINE",
					destination: "CRM",
					correlationId: "cor123",
					operation: "payment",
					srDate: "1644325214407",
					Authorization: `${auth.tokenType} ${auth.accessToken}`,
				},
				data: data || undefined,
			};
			//console.log("Data from make call:", data);
			const response = await axios.request(options);
			// console.log("Axios Response  from aleposervice make call",response)
			return response.data;
		} catch (error) {
			//console.error(error);
			logger.error(error);
			return error;
			logger.error(error);
			// Send an error;
		}

		// return { response, status: status ? true : false };
	}
}

module.exports = ConvalenceCallService;
