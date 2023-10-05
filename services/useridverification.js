const ConvalenceCallService = require("../utils/covalenceReq");
const covalenceReq = new ConvalenceCallService();
const config = require("../configs/index");
const { logger } = require("../utils/logger");

exports.customerVerification = async (customerID) => {
	let covcall = await covalenceReq.makeCall(
		"GET",
		`${config.COVALENSE.getCustomerURL}/${customerID}`
	);
	if (!covcall.success) {
		return { ok: false, payload: "user not found" };
	} else if (covcall.success) {
		let { email, firstName, lastName, phone, status, custReference } =
			covcall.result.customers[0];
		return {
			ok: true,
			payload: { status, firstName, lastName, custReference },
		};
	} else {
		return { ok: false, payload: "error" };
	}
};

exports.covalencepayment = async (
	customer_id,
	data_ref,
	amount,
	bank,
	ccAgent
) => {
	const data = {
		userid: customer_id,
		amount: amount,
		paymentmethod: bank,
		paymentdate: new Date(),
		receiptno: `BANKINT|${bank}|${ccAgent}`,
		itemcode: 1,
		itemname: "REFILL",
		itemamount: amount,
		depositsLipnumber: ccAgent,
		depositorsName: ccAgent,
		paymentreference: `${data_ref}|SBT`,
		//${bank}||${ccAgent}||
	};
	//console.log("request Payload:", data);
	let notifyPayment = await covalenceReq.makeCall(
		"POST",
		`${config.COVALENSE.notificationURL}`,
		data
	);
	if (!notifyPayment.success) {
		let { success, result } = notifyPayment;
		let msg = notifyPayment.result.errorMessage;
		logger.info(
			`PaymentLog- Status--${success}--errorInfo---${msg}-PaymentRef--:${data_ref}|SBT`
		);
		return { ok: false, payload: msg };
	} else if (notifyPayment.success) {
		let { success, result } = notifyPayment;
		let msg = notifyPayment.result.message;
		logger.info(
			`PaymentLog- Status--${success}--SuccessInfo---${msg}--PaymentRef--:${data_ref}|SBT`
		);
		return { ok: true, payload: msg };
	} else {
		logger.info(`PaymentLog- Unforseen Error`);
		return { ok: false, payload: "unforseen error please contact admin" };
	}
};
