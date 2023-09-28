const Users = require("../model/user");

exports.getUsers = async () => {
	const users = await Users.find();
	return users;
};

exports.getUserById = async (userId) => {
	const user = await Users.findById(userId);
	return user;
};

exports.getUserByEmail = async (email) => {
	const user = await Users.findOne({ email });
	return user;
};

exports.getUserByEmailAndPassword = async (email, password) => {
	const user = await Users.findOne({ email, password });
	return user;
};
