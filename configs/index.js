const config = {
	COVALENSE: {
		siginURL: process.env.COVALENSE_SIGN_IN,
		getCustomerURL: process.env.COVALENSE_CUSTOMER_INFO,
		notificationURL: process.env.COVALENSE_NOTIFICATION,
		usernameOrEmail: process.env.COVALENSE_USERNAME,
		password: process.env.COVALENSE_PASSWORD,
		rsvURL: process.env.COVALENSE_RSV,
	},
	SMS: {
		username: process.env.SMSUSERNAME,
		password: process.env.SMSPASSWORD,
		source: process.env.SMSSOURCE,
	},
	REDIS: {
		redisURL: process.env.REDIS_URL || "redis://127.0.0.1:6379/",
	},
};

//console.log(config.COVALENSE.rsvURL);

module.exports = config;
