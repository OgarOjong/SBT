const { Worker } = require("bullmq");
const { logger } = require("../utils/logger");
const { covalencepayment } = require("../services/useridverification");
const { findTransaction } = require("../services/upload");
const { updateFile } = require("../services/upload");
const redis = require("redis");
const client = redis.createClient();
const Lock = require("redis-lock");

async function processPaymentJob(jobData) {
	const {
		customer_id,
		data_ref,
		bankName,
		paymentAGENT,
		bank,
		paymentAmount,
		paymentchannel,
		file_id,
	} = jobData.data;

	// Acquire a lock for this job based on the data_ref
	const lockKey = `job_lock:${data_ref}`;
	const lock = new Lock(client, lockKey, { timeout: 5000 });

	try {
		const lockAcquired = await lock.acquire();

		if (!lockAcquired) {
			// Another worker already holds the lock; skip processing
			console.log(
				`Duplicate job skipped (lock acquired): data_ref=${data_ref}`
			);
			return;
		}

		// Check if the payment has already been processed
		const transctionStatus = await findTransaction(bank, data_ref);
		if (transctionStatus.data.csv.status === "updated") {
			logger.info(
				`payment already processed possible duplicate from race-condition--DateRef: ${data_ref} --bank:${bank}`
			);
			console.log("Possible Duplicate payment processing");
			throw Error("Possible Duplicate payment processing");
		}

		const paymentNotifier = await covalencepayment(
			customer_id,
			data_ref,
			paymentAmount,
			bankName,
			paymentAGENT
		);
		console.log("paymentNotifies In Worker Status", paymentNotifier);
		if (!paymentNotifier.ok) {
			logger.info(
				`initiator:${paymentAGENT}--errorInfo:${paymentNotifier.payload}--${paymentNotifier.ok}`
			);
			return {
				ok: false,
				message: { covalenceRes: paymentNotifier.ok, payload: "payment error" },
			};
		} else if (paymentNotifier.ok) {
			logger.info(
				`initiator:${paymentAGENT}--Amount:${paymentAmount}--Info:${paymentNotifier.payload}--${paymentNotifier.ok}`
			);
			return {
				ok: true,
				message: {
					covalenceRes: paymentNotifier.ok,
					covalenceResMessage: paymentNotifier.payload,
					data_ref,
					paymentchannel,
					customer_id,
					paymentAGENT,
					file_id,
					paymentAmount,
				},
			};
		}
	} catch (error) {
		logger.error(
			`DataRef: ${data_ref} --Bank: ${bank} Queue process error`,
			error.message
		);
		console.log("Queue process error", error.message);
	} finally {
		// Release the lock
		await lock.release();
	}
}

const worker = new Worker("paymentQueue", processPaymentJob);
worker.on("error", (err) => {
	logger.info(`WorkerError Event StackMessage : ${err.message}`);
	console.log(`${job.id} has an Error with message ${err.message}!`);
	console.error(err);
});
worker.on("completed", async (job, result) => {
	if (!result) {
		logger.info(
			`Unforeseen scenario check the Worker Queue implementation JobId: ${job.id}, data_ref:${result.message.data_ref}`
		);
	} else if (result && result.message.covalenceRes) {
		const {
			data_ref,
			paymentchannel,
			customer_id,
			paymentAGENT,
			file_id,
			paymentAmount,
		} = result?.message;
		const paymentUpdate = await updateFile({
			data_ref,
			paymentchannel,
			customer_id,
			paymentAGENT,
			file_id,
			paymentAmount,
		});
		console.log(`${job.id} has completed!`);
		logger.info(`Queues: ${job.id} has completed!`);
	} else {
		logger.info(
			`Unforeseen scenario Two check the Worker Queue implementation JobId: ${job.id}, data_ref:${result.message.data_ref}`
		);
	}
});

worker.on("failed", (job, err) => {
	console.log(`${job.id} has failed with ${err.message}`);
	logger.info(
		`Queue: Job failed JobID:${job.id}-- errorMessage:${err.message} `
	);
});
//worker.start();
module.exports = worker;
