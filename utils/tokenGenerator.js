const crypto = require("crypto");

module.exports.generateToken = () => {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(20, (err, buf) => {
			if (err) {
				console.log("error from crypto", err);
				reject(err);
			} else {
				const toks = buf.toString("hex");
				//console.log("the toks", toks);
				resolve(toks);
			}
		});
	});
};
