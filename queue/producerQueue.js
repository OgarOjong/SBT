const { Queue } = require("bullmq");
const { logger } = require("../utils/logger");
//const { connection } = require("./workerQueue");
const redisOptions = { host: "localhost", port: 6379 };
const IORedis = require("ioredis");
const connection = new IORedis();

const covalenceQueue = new Queue("paymentQueue", {
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "fixed", // this means the rety will happen based on the delay alone and not calculaed exponentiallly
			delay: 2000, // this is in miliseconds
		},
	},
	connection,
});

module.exports.initQueue = async (paymentPayload) => {
	const { customer_id, data_ref, amount, bankName, paymentAGENT } =
		paymentPayload;
	console.log("queue payload", paymentPayload);
	const res = await covalenceQueue.add(
		data_ref,
		{ ...paymentPayload },
		{ delay: 1000 },
		{ removeOnComplete: 1000 }
	);
	//look for events associated with jobs-- I want to update something is redis db once a job is added and read send the data to the fron
	logger.info(`job added to Queue--dataRefence:${data_ref} --JobID: ${res.id}`);
	console.log(`job added to Queue--dataRefence:${data_ref} --JobID: ${res.id}`);
};

//init();
