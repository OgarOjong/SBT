import { Queue, QueueScheduler } from "bullmq";

const redisOptions = { host: "localhost", port: 6379 };

// QUEUE SETUP
const queue = {
	covalenceQueue: new Queue("covalenceQueue", {
		connection: redisOptions,
	}),
};

const scheduler = {};
