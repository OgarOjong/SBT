const { Worker } = require("bullmq");
const { logger } = require("../utils/logger");
const { covalencepayment } = require("../services/useridverification");
const { findTransaction } = require("../services/upload");
const { updateFile } = require("../services/upload");

async function processPaymentJob(jobData) {
	const {
		customer_id,
		data_ref,
		bankName,
		paymentAGENT,
		bank,
		paymentchannel,
	} = jobData.data;
	console.log("WorkerData", jobData.data);
	const transctionStatus = await findTransaction(bank, data_ref);
	if (transctionStatus.data.csv.status === "updated") {
		logger.info(
			`payment already processed possible duplicte from race-condition--DateRef: ${data_ref} --bank:${bank}`
		);
		return;
	}
	try {
		const paymentNotifier = await covalencepayment(
			customer_id,
			data_ref,
			amount,
			bankName,
			paymentAGENT
		);
		if (!paymentNotifier.ok) {
			//req.flash("error", paymentNotifier.payload);
			logger.info(
				`initiator:${updater}--errorInfo:${paymentNotifier.payload}--${paymentNotifier.ok}`
			);
			return; //res.redirect(`/uploader/${bank}/pendings/`);
		}
		logger.info(
			`initiator:${updater}--Amount:${depositAmount}--Info:${paymentNotifier.payload}--${paymentNotifier.ok}`
		);
		const paymentUpdate = await updateFile({
			data_ref,
			paymentchannel,
			customer_id,
			paymentAgent,
			file_id,
			amount,
		});
	} catch (error) {
		logger.error("Queue process error", error.message);
		console.log("Queue process error", error.message);
	}
}

const worker = new Worker("paymentQueue", processPaymentJob);
//console.log("the worker", worker);

worker.on("completed", (job) => {
	console.log(`${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
	console.log(`${job.id} has failed with ${err.message}`);
});
//worker.start();
module.exports = worker;
