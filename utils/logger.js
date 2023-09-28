const { createLogger, transports } = require("winston");
const winston = require("winston");
const { combine, timestamp, printf, colorize, splat } =
	require("winston").format;
const winstonDaily = require("winston-daily-rotate-file");
const moment = require("moment-timezone");
const dateTime = moment
	.tz(Date.now(), "Africa/Lagos")
	.format()
	.slice(0, 19)
	.replace("T", " ");
const path = require("path");
const winstonTimestampColorize = require("winston-timestamp-colorize");

const today = new Date();
const month = (today.getMonth() + 1).toString().padStart(2, "0");
const date = `${today.getFullYear()}-${month}-${today
	.getDate()
	.toString()
	.padStart(2, "0")}`;
const logDir = path.join(__dirname, "..", "logs");
const debugDir = path.join(logDir, "debug");
const errDir = path.join(logDir, "error");
const logPath = `${date}.log`.slice(0, 14);
console.log(logPath);

const logger = createLogger({
	format: combine(
		timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
		printf((info) => `{${info.timestamp}: ${info.level}: ${info.message}}`)
	),
	transports: [
		new winstonDaily({
			level: "debug",
			datePattern: "YYYY-MM-DD",
			dirname: debugDir,
			filename: "%DATE%.log",
			extension: "", // add this line to remove the date from the end of the filename
			maxFiles: 30, //A max file of 30 will be stored before being remove to make room for any other new file
			json: true,
			zippedArchive: true,
		}),
		new winstonDaily({
			level: "error",
			datePattern: "YYYY-MM-DD",
			dirname: errDir,
			filename: "%DATE%.log",
			extension: "",
			maxFiles: 30,
			json: true,
			zippedArchive: true,
		}),
	],
});

logger.add(
	new transports.Console({
		format: combine(
			splat(),
			colorize(),
			winstonTimestampColorize({ color: "red" })
		),
	})
);

const stream = {
	write: (message) => {
		logger.info(message.substring(0, message.lastIndexOf("\n")));
	},
};

module.exports = {
	logger,
};
