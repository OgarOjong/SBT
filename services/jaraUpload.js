const fs = require("fs");
const csv = require("csv-parser");
const os = require("os");
const JaraFiles = require("../model/jara");
const FCMB = require("../model/bankModules");
const { getOSName } = require("./utils");
const { JARA } = require("../configs/jaraValidator");
const { v4: uuidv4 } = require("uuid");
const { ValBankData } = require("./bankValidator");

exports.upload = async (payload) => {
	const file_path = payload.file.path;
	const users = payload.user;
	//console.log("User: ", users.email);
	const { dated } = payload.body;
	const { ip } = payload;
	let status = { ok: true, message: "" };
	let expectedHeaders = JARA[0].header;
	//console.log("Expected Header", expectedHeaders);

	let result = [];
	let headers = [];

	try {
		const userOSName = getOSName(os.platform());
		const readfile = await new Promise((resolve, reject) => {
			fs.createReadStream(file_path)
				.pipe(csv())
				.on("headers", (headerList) => {
					headers = headerList.map((header) => header.trim());
					//console.log({ headers });
					if (!validateHeaders(headers, expectedHeaders)) {
						status = {
							ok: false,
							message:
								"Invalid CSV file. Headers do not match the format provided for jara",
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
						smsstatus: "",
					});
				})
				.on("end", () => {
					resolve(true);
				});
		});

		let updateFile = await JaraFiles.create({
			ip,
			csv: result,
			profiledDate: dated,
			os: userOSName,
			uploaderEmail: users.email,
			user: users._id,
		});
		status = { ok: true, message: "Document uploaded successfully" };
	} catch (error) {
		console.error("Error uploading CSV:", error);
		// throw new Error("Error uploading CSV");
		console.log("Jara Uploading error", error);
		return status;
	}
	return status;
};

//this is the function to retrieve Jara Dealers
exports.findDealerbyDate = async (payload) => {
	let update = { ok: true, message: "null" };
	try {
		const { dealercode, dated } = payload;
		const treamedDealerCode = dealercode.trim();
		console.log({ dealercode });
		const pipeline = [
			{
				$match: {
					$expr: {
						$eq: [
							{ $dateToString: { format: "%Y-%m-%d", date: "$profiledDate" } },
							dated,
						],
					},
				},
			},
			{
				$unwind: "$csv",
			},
			{
				$match: {
					"csv.DEALER": { $regex: new RegExp(treamedDealerCode, "i") },
				},
			},
			{
				$project: {
					csv: 1,
				},
			},
		];
		const result = await JaraFiles.aggregate(pipeline);
		if (result.length === 0) {
			return (update = { ok: false, message: "Dealer not found" });
		} else {
			update = { ok: true, message: result };
		}
	} catch (err) {
		update = { ok: false, message: "contact administrator" };
		console.log("findDealerBydate error", err);
	}
	console.log();
	return update;
};

function validateHeaders(headers, expectedHeaders) {
	return (
		JSON.stringify(headers.sort()) === JSON.stringify(expectedHeaders.sort())
	);
}
