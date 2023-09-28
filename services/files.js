const Files = require("../model/files");

exports.getFiles = async () => {
	//const files = await Files.find();
	//const files = await Files.findOne();
	const pipeline = [
		{
			$match: {
				$and: [
					{
						$or: [
							{ "csv.status": { $ne: "updated" } }, // At least one object has status not equal to "updated"
							{ "csv.status": { $exists: false } }, // No csv.status field in the document
						],
					},
					{
						$or: [{ state: "Active" }, { state: null }], //the state of the file is Active
					},
				],
			},
		},
	];

	const files = await Files.aggregate(pipeline);
	return files;
};

exports.getSingleFile = async (fileId) => {
	const file = await Files.findById(fileId);
	return file;
};

exports.archiveSingleFile = async (fileId) => {
	let archivalStatus = {};
	try {
		const file = await Files.findByIdAndUpdate(
			fileId,
			{ state: "Archive" },
			{ new: true }
		);
		return (archivalStatus = file
			? { ok: true, message: "Archived" }
			: { ok: false, message: "Not Archived" });
	} catch (error) {
		console.log("FileArchivalError", error);
		throw error;
	}
};
