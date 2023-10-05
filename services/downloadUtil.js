const fs = require("fs");
const csv = require("csv-parser");
const os = require("os");
const Files = require("../model/files");
const { getOSName } = require("./utils");
const { BANKS } = require("../configs/banks");
const { createObjectCsvWriter } = require("csv-writer");
const paths = require("path");
const path = require("path");

module.exports.bankDump = async (payload) => {
	let { bank, location, startDate, endDate } = payload;
	console.log("startDate: ", startDate, "endDate: ", endDate);
	console.log("Payload", payload);
	try {
		const pipeLine = [
			{
				$match: {
					bank: bank,
					location: location,
					createdAt: {
						$gte: new Date(startDate),
						$lte: new Date(endDate),
					},
				},
			},
			{
				$unwind: "$csv",
			},
			{
				$replaceRoot: {
					newRoot: "$csv",
				},
			},
		];

		const bankDump = await Files.aggregate(pipeLine);
		return bankDump;
		//console.log("the DumpFile", bankDump.length);
	} catch (error) {
		console.log("error BankDump", error.message);
	}
};

module.exports.writeCsvFile = async (arr, bank) => {
	const bankHeaders = BANKS.find((banks) => banks.name === bank);
	const otherHaderValues = [
		"customer_id",
		"location",
		"paymentchannel",
		"status",
		"updater",
		"data_ref",
		"updatedDate",
	];
	const bankHeader = [...bankHeaders.header, ...otherHaderValues];
	const bankName = bank.replace(/\s+/g, "");
	let time = Date.now();
	let fileName = `${bankName}.${time}.csv`;
	let csvHeader = bankHeader.reduce((result, eachHeader) => {
		result.push({ id: eachHeader, title: eachHeader });
		return result;
	}, []);
	const folderPath = path.join(__dirname, "../", "downloads");

	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
	try {
		const csvWrite = createObjectCsvWriter({
			path: `${paths.join(__dirname, "../", "downloads", fileName)}`,
			header: csvHeader,
		});

		const writtenStatus = await csvWrite.writeRecords(arr);
		const fileFullPath = path.join(folderPath, fileName);
		const fileStat = fs.statSync(fileFullPath);
		//	console.log("file Size", fileStat);
		return { ok: true, file: fileName, folderPath, fileSize: fileStat.size };
	} catch (error) {
		console.log("csvWrite", error);
	}
};
