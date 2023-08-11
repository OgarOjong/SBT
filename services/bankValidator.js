const Files = require("../model/files");
const { BANKS } = require("../configs/banks");

exports.ValBankData = async (
	bank,
	result,
	dataUpdate,
	ip,
	userOSName,
	user,
	useremail,
	location
) => {
	const bankName = BANKS.find((singlebank) => singlebank.name === bank);

	const validatorParams = bankName.validator;

	let duplicate = [];
	let entries = [];

	if (bank === bankName.name) {
		for (const entry of result) {
			const query = {
				bank,
				$and: validatorParams.map((param) => ({
					[`csv.${param}`]: entry[param],
				})),
			};

			const existingEntry = await Files.findOne(query);

			if (existingEntry) {
				duplicate.push(entry);
			} else {
				entries.push(entry);
			}
		}

		if (entries.length > 0) {
			await Files.create({
				bank,
				location,
				ip,
				os: userOSName,
				user,
				uploaderEmail: useremail,
				csv: entries, // Use entries directly without wrapping in an extra array
			});
		}
	}

	console.log("Duplicate", duplicate);
	return {
		ok: true,
		message: `${
			duplicate.length
		} Duplicate records found, ${dataUpdate} Number of Records found, ${
			dataUpdate - duplicate.length
		} Number of records updated`,
	};
};
