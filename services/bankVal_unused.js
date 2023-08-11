const Files = require("../model/files");
const { BANKS } = require("../configs/banks");

exports.ValBankData = async (
	bank,
	result,
	dataUpdate,
	ip,
	userOSName,
	location
) => {
	const bankName = BANKS.find((singlebank) => singlebank.name === bank);

	let validatorPram = bankName.validator;

	let duplicate = [];

	if (bank === "First City Monument Bank(FCMB)") {
		for (const entry of result) {
			for (let validator of validatorPram) {
				const existingEntry = await Files.findOne({
					bank,

					"csv.Tran Date": entry["Tran Date"],
					"csv.Transaction Details": entry["Transaction Details"],
				});

				if (existingEntry) {
					duplicate.push(entry);
				} else {
					await Files.create({
						bank,
						location, // Make sure location is defined
						ip,
						os: userOSName,
						csv: [entry], // Create an array for the csv field with the entry
					});
				}
			}
		}
	}

	return {
		ok: true,
		message: `${
			duplicate.length
		} Duplicates record found,${dataUpdate} Number of Records found, ${
			dataUpdate - duplicate.length
		} Number of records updated`,
	};
};
