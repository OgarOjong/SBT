const getOSName = (platform) => {
	switch (platform) {
		case "darwin":
			return "macOS";
		case "win32":
			return "Windows";
		case "linux":
			return "Linux";
		default:
			return "Unknown";
	}
};

module.exports = {
	getOSName,
};
