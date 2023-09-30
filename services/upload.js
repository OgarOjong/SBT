const fs = require("fs");
const csv = require("csv-parser");
const os = require("os");
const Files = require("../model/files");
const { getOSName } = require("./utils");
const { BANKS } = require("../configs/banks");
const { v4: uuidv4 } = require("uuid");
const { ValBankData } = require("./bankValidator");
const { logger } = require("../utils/logger");
const { pipeline } = require("stream");
const JaraFiles = require("../model/bankModules");

exports.upload = async (payload) => {
	const file_path = payload.file.path;
	const users = payload.user;
	const { bank, location } = payload.body;
	let status = { ok: true, message: "" };
	let transactionDateRegx =
		/^\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/$/;

	const bankName = BANKS.find((singlebank) => singlebank.name === bank);
	if (!bankName) {
		status = { ok: false, message: "Invalid bank selected." };
	}

	let expectedHeaders = bankName.header;
	console.log("Expected Header", expectedHeaders);
	console.log("Expected BankName", bankName.name);

	let result = [];
	let headers = [];

	try {
		const readfile = await new Promise((resolve, reject) => {
			fs.createReadStream(file_path)
				.pipe(csv())
				.on("headers", (headerList) => {
					headers = headerList.map((header) => header.trim());
					console.log({ headers });
					if (!validateHeaders(headers, expectedHeaders)) {
						status = {
							ok: false,
							message:
								"Invalid CSV file. Headers do not match the expected format for the selected bank.",
						};
						reject(new Error(status.message));
					} else {
						console.log("we are good");
					}
				})
				.on("data", (data) => {
					// Initialize a flag to indicate if all values are empty or null
					let allValuesEmptyOrNull = true;
					const isEmptyOrNull = Object.values(data).some((value) => {
						const trimmedValue = (value || "").trim(); // Trim the value
						if (trimmedValue !== null || trimmedValue !== "") {
							allValuesEmptyOrNull = false; // if atlease one value is not empty this will defaut to true
						}
						//return trimmedValue === null || trimmedValue === "";
					});

					if (!allValuesEmptyOrNull) {
						result.push({
							...data,
							data_ref: uuidv4(),
							//data_ref: String(new Date().getTime()),
							customer_id: "",
							location: location,
							paymentchannel: "",
							status: "",
							updater: "",
							updatedDate: "",
						});
					} else {
						console.log("Empty data skipping", data);
					}
				})
				.on("end", () => {
					resolve(true);
				});
		});

		const userOSName = getOSName(os.platform());
		console.log("User Os", userOSName);
		let updatefile = await ValBankData(
			bank,
			result,
			result.length,
			payload.ip,
			userOSName,
			users._id,
			users.email,
			location
		);
		status = updatefile;

		return status;
	} catch (error) {
		console.log({ error });
		console.log("chekcikng Error", error.message);
		// throw new Error("Error uploading CSV");
		return {
			ok: false,
			message: error.message,
		};
	}
};

exports.updateFile = async (payload) => {
	let update;
	try {
		const {
			data_ref,
			customer_id,
			paymentchannel,
			updater,
			file_id,
			depositAmount,
		} = payload;
		//console.log("Values passed for updating", payload);
		const isUpdated = await Files.findOne({
			"csv.data_ref": data_ref,
			status: "updated",
		});
		//console.log({ isUpdated, data_ref });
		//console.log(isUpdated);
		if (isUpdated) return;
		update = await Files.findOneAndUpdate(
			{ _id: file_id, "csv.data_ref": data_ref },
			{
				$set: {
					"csv.$.customer_id": customer_id,
					"csv.$.paymentchannel": paymentchannel,
					"csv.$.status": "updated",
					"csv.$.updater": updater,
					"csv.$.updatedDate": new Date(),
				},
			},

			{
				//arrayFilters: [{ "element.file_id": file_id }],
				new: true,
			}
		);
		logger.info(
			`updated:--Channel:${paymentchannel}--CustomerID:${customer_id}--Updater:${updater}--Amount:${depositAmount}`
		);
	} catch (err) {
		console.log(err);
		logger.error(err);
	}

	//console.log({ update });
	return update;
};

exports.findTransaction = async (bank, data_ref) => {
	console.log("the bank passs:" + bank + " the data ref passed:" + data_ref);
	const pipeline = [
		{
			$match: { bank: bank },
		},
		{
			$unwind: "$csv",
		},
		{
			$match: { "csv.data_ref": data_ref },
		},
		{
			$project: { csv: 1 },
		},
	];
	try {
		const findFile = await Files.aggregate(pipeline);
		console.log("The array length", findFile.length);

		if (findFile.length > 0) {
			return { ok: true, data: findFile[0] };
		} else {
			return { ok: false, data: "No data" };
		}
	} catch (err) {
		console.log("Fine Transaction", err);
	}
};

module.exports.updateSmsStatus = async (file_id, date, phonenumber, status) => {
	// Parse the input date string to a JavaScript Date object
	const parsedDate = new Date(date);
	console.log("Parseddate", parsedDate);
	console.log("id", file_id);
	console.log("phonenumber", phonenumber);
	console.log("status", status);
	try {
		let updatedVar = await JaraFiles.findOneAndUpdate(
			{
				_id: file_id,
				//		"csv.$.PHONE": phonenumber,
				profiledDate: parsedDate,
				"csv.PHONE": phonenumber,
			},
			{
				$set: {
					"csv.$.smsstatus": status,
				},
			},
			{
				//arrayFilters: [{ "element.file_id": file_id }],
				new: true,
			}
		);
		console.log("updated Value", updatedVar);
	} catch (error) {
		console.log("updated Error", error);
	}
};

function validateHeaders(headers, expectedHeaders) {
	return (
		JSON.stringify(headers.sort()) === JSON.stringify(expectedHeaders.sort())
	);
}

exports.getBanks = () => {
	return BANKS;
};
