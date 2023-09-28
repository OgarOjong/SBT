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

exports.getBankFiles = async () => {
	/* const files = await Files.find()
  .where('state')
  .in(['Active', null])
  .exec();
 */
	const files = await Files.find({
		$or: [{ state: "Active" }, { state: null }],
	}).exec();
	//console.log("All non Archived files", files);
	const sortedFiles = files.map((file) => {
		const csvs = file.csv.map((csv) => ({ ...file.toObject(), csv }));
		return csvs;
	});
	const flattenedArray = sortedFiles.flatMap((innerArray) => innerArray);
	// console.log({ flattenedArray });
	const banks = BANKS.map((bank) => {
		const pendings = flattenedArray.filter(
			(p) =>
				p.bank === bank.name && (p.csv.status === "" || p.csv.status === null)
		);
		const updateds = flattenedArray.filter(
			(p) => p.bank === bank.name && p.csv.status === "updated"
		);
		// console.log({ name: bank.name, pending: pendings });
		return {
			name: bank.name,
			color: bank.color,
			pending: pendings,
			updated: updateds,
			logo: bank.logo,
		};
	});
	return banks;
};

exports.getBankFilesByUpdate = async (bankname, updateType) => {
	const files = await Files.find();
	const sortedFiles = files.map((file) => {
		const csvs = file.csv.map((csv) => ({ ...file.toObject(), csv }));
		return csvs;
	});
	const flattenedArray = sortedFiles.flatMap((innerArray) => innerArray);
	// console.log({ flattenedArray });
	const bankName = BANKS.find((singlebank) => singlebank.name === bankname);
	const pendings = flattenedArray.filter(
		(p) =>
			p.bank === bankName.name && (p.csv.status === "" || p.csv.status === null)
	);
	const updateds = flattenedArray.filter(
		(p) => p.bank === bankName.name && p.csv.status === "updated"
	);

	if (updateType === "pendings") {
		// console.log({ pendings });
		return {
			name: bankName.name,
			color: bankName.color,
			pending: pendings,
			logo: bankName.logo,
			//updated: updateds,
		};
	} else {
		//	console.log({ updateds });
		return {
			name: bankName.name,
			color: bankName.color,
			//pending: pendings,
			updated: updateds,
			logo: bankName.logo,
		};
	}

	// console.log({ name: bank.name, pending: pendings });
};
