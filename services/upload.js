const fs = require("fs");
const csv = require("csv-parser");
const os = require("os");
const Files = require("../model/files");
const FCMB = require("../model/bankModules");
const { getOSName } = require("./utils");
const { BANKS } = require("../configs/banks");
const { ValBankData } = require("./bankValidator");

exports.upload = async (payload) => {
	const file_path = payload.file.path;
	const users = payload.user;
	console.log("User: ", users.email);
	const { bank, location } = payload.body;
	let status = { ok: true, message: "" };

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
						reject(new Error("Invalid CSV headers"));
					} else {
						console.log("we are good");
					}
				})
				.on("data", (data) => {
					//console.log("checking for each data:", data);
					result.push({
						...data,
						data_ref: String(new Date().getTime()),
						customer_id: "",
						bank: "",
						status: "",
					});
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
		/*	for (const item of result) {
			await Files.create({
				bank,
				location,
				ip: payload.ip,
				os: userOSName,
				...item, // Spread the properties of each item
			});
		}
*/
		/*
		await Files.create({
			bank,
			location,
			ip: payload.ip,
			os: userOSName,
			csv: result,
		});
*/
		return status;
	} catch (error) {
		console.error("Error uploading CSV:", error);
		// throw new Error("Error uploading CSV");
		return {
			ok: false,
			message: "Error uploading CSV please check bank format",
		};
	}
};

exports.updateFile = async (payload) => {
	const { data_ref, customer_id, paymentOption } = payload;
	const isUpdated = await Files.findOne({
		"csv.data_ref": data_ref,
		status: "updated",
	});
	console.log({ isUpdated, data_ref });
	if (isUpdated) return;
	const update = await Files.findOneAndUpdate(
		{ "csv.data_ref": data_ref },
		{
			$set: {
				"csv.$.customer_id": customer_id,
				"csv.$.paymentOption": paymentOption,
				"csv.$.status": "updated ",
			},
		}
	);
	console.log({ update });
	return update;
};

function validateHeaders(headers, expectedHeaders) {
	return (
		JSON.stringify(headers.sort()) === JSON.stringify(expectedHeaders.sort())
	);
}

exports.getBanks = () => {
	return BANKS;
};
