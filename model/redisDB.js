const { REDIS } = require("../configs/index");
const redis = require("redis");
const { logger } = require("../utils/logger");
//const { Queue } = require("bullmq");
console.log(REDIS.redisURL);
var client = redis.createClient(REDIS.redisURL);

client.on("error", console.log("Error connecting to redis"));

client.on("connect", function () {
	logger.info("Redis database connection successful");
	console.log("Redis Db connected");
});

module.exports = client;
