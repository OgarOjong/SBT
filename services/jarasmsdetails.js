const JaraFiles = require("../model/jara");
require("dotenv").config();
const { logger } = require("../utils/logger");
const axios = require("axios");
const { SMS } = require("../configs/index");
const { updateSmsStatus } = require("../services/upload");

const mongoose = require("mongoose");

module.exports.smsFile = async (date) => {
	try {
		const pipeline = [
			{
				$match: {
					$expr: {
						$eq: [
							{ $dateToString: { format: "%Y-%m-%d", date: "$profiledDate" } },
							date,
						],
					},
				},
			},
			{
				$unwind: "$csv",
			},
			{
				$project: {
					dealer: "$csv.DEALER",
					phone: "$csv.PHONE",
					renewal_percentage: "$csv.RENEWAL_BY_PERCENT",
					alocated_customers: "$csv.Count_of_allocated_Customers",
					rank: "$csv.RANK",
					all_renewals: "$csv.All_RENEWAL",
					smsstatus: "$smsstatus",
				},
			},
		];
		/*
		const pipeline = [
			{
				$match: {
					$expr: {
						$eq: [
							{ $dateToString: { format: "%Y-%m-%d", date: "$profiledDate" } },
							date,
						],
					},
				},
			},
			{
				$unwind: "$csv",
			},
			{
				$group: {
					_id: "$_id", // Group by a unique identifier (e.g., the document's _id)
					data: {
						$push: {
							dealer: "$csv.DEALER",
							phone: "$csv.PHONE",
							renewal_percentage: "$csv.RENEWAL_BY_PERCENT",
							alocated_customers: "$csv.Count_of_allocated_Customers",
							rank: "$csv.RANK",
							all_renewals: "$csv.All_RENEWAL",
						},
					},
					smsstatus: { $first: "$smsstatus" }, // Extract the "status" field (assuming it's the same for all documents)
				},
			},
			{
				$unwind: "$data",
			},
			{
				$project: {
					_id: 0, // Exclude _id field from the output if needed
					data: 1, // Include the grouped data
					smsstatus: 1, // Include the "status" field
				},
			},
		];*/
		const files = await JaraFiles.aggregate(pipeline);
		//const files = await JaraFiles.find({ profiledDate: date }); // Use await to wait for the result
		//console.log("Jara Files", files);
		return files;
	} catch (error) {
		console.error("Error fetching files:", error);
	}
};

module.exports.smsService = async (arr, date) => {
	if (arr.length === 0) {
		return;
	} else if (arr.length > 0) {
		await Promise.all(
			arr.map(async (x) => {
				//console.log(x.phone);
				let {
					dealer,
					phone,
					renewal_percentage,
					alocated_customers,
					rank,
					all_renewals,
					smsstatus,
					_id,
				} = x;
				phone = `234${phone}`;
				const msg = `Dear ${dealer}, your statistic for ${date} is Count of Allocated customer:${alocated_customers}, All Renewals :${all_renewals}, Renewal by percentage: ${renewal_percentage.replace(
					"%",
					""
				)} and RANK :${rank}`;
				//const msg = `Dear ${dealer}, your statistic for ${date} is Count of Allocated customer:${alocated_customers}, All Renewals :${all_renewals}, Renewal by percentage :${renewal_percentage} and RANK :${rank}`;
				const option = {
					method: "get",
					maxBodyLength: Infinity,
					url: `http://ngn.rmlconnect.net:8080/bulksms/bulksms?username=${SMS.username}&password=${SMS.password}&type=0&dlr=1&destination=${phone}&source=${SMS.source}&message=${msg}`,
					headers: {},
				};
				//console.log("message:", msg);
				console.log("message-options", option);
				try {
					const response = await axios.request(option);
					const { data } = response;
					logger.info(
						`sms_sent_status-dealer-${dealer}-phoneNumber-${phone}-status-${data}`
					);
					let updateStatus = await updateSmsStatus(_id, date, phone, data);
					console.log("Update Status", updateStatus);
				} catch (err) {
					console.log("sms-error", err);
					logger.error(`SMS ERROR-- ${err}`);
				}
			})
		);
	}
};
