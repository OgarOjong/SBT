const Files = require("../model/files");

exports.getFiles = async () => {
	const files = await Files.find();
	return files;
};

exports.getSingleFile = async (fileId) => {
	const file = await Files.findById(fileId);
	return file;
};
