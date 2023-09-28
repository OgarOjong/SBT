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
};

console.log(config.COVALENSE.rsvURL);

module.exports = config;
