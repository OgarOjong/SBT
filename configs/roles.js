const ROLES = [
	{
		role: "auditor",
		identier: "Auditor",
		allowed_path: ["*"],
	},
	{
		role: "customer_care",
		identier: "Customer Care",
		allowed_path: ["/filelist"],
	},
	{
		role: "finance_admin",
		identier: "Finance Admin",
		allowed_path: ["/upload"],
	},
	{
		role: "jara_admin",
		identier: "Jara Admin",
		allowed_path: ["/jara"],
	},
];

module.exports = {
	ROLES,
};
