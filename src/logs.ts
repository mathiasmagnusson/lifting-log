import express from "express";

import * as db from "./db";
import { InvalidUserState, InvalidInput } from "./errors";

const router = express.Router();

router.get("/", async (req, res) => {
	const logs = await db.logs.find({
		accountId: req.user._id,
		_id: { $ne: req.user.activeLogId },
	});

	res.send(logs);
});

router.post("/", async (req, res, next) => {
	try {
		if (req.user.activeLogId)
			throw new InvalidUserState("Active log already exists");

		const log = await db.logs.insert({
			accountId: req.user._id,
			startTime: Date.now(),
			lifts: [],
		});

		req.user.activeLogId = log._id;

		await db.accounts.findOneAndUpdate({ _id: req.user._id }, {
			$set: {
				activeLogId: req.user.activeLogId,
			},
		});

		res.send(await db.logs.findOne({ _id: req.user.activeLogId }));
	} catch (err) {
		next(err);
	}
});

router.post("/finish", async (req, res, next) => {
	try {
		if (!req.user.activeLogId)
			throw new InvalidUserState("No active log exists");

		const log = await db.logs.findOne({
			_id: req.user.activeLogId,
		});

		if (log && log.lifts.length === 0) {
			await db.logs.findOneAndDelete(
				{ _id: log?._id },
			);
		} else {
			await db.logs.findOneAndUpdate(
				{ _id: req.user.activeLogId },
				{ $set: { endTime: Date.now() } },
			);
		}

		await db.accounts.findOneAndUpdate(
			{ _id: req.user._id },
			{ $set: { activeLogId: null } },
		);

		res.send({});
	} catch (err) {
		next(err);
	}
});

router.get("/:id", async (req, res, next) => {
	try {
		const logId = req.params.id === "active"
			? req.user.activeLogId
			: req.params.id;

		const log = await db.logs.findOne({ _id: logId });

		res.send(log ?? "null");
	} catch (err) {
		next(err);
	}
});

router.post("/:id", async (req, res, next) => {
	try {
		const logId = req.params.id === "active"
			? req.user.activeLogId
			: req.params.id;

		let log = await db.logs.findOne({ _id: logId });

		if (!log) throw new InvalidInput("No such log exists");

		const lift = req.body;
		try {
			await db.validateLift(lift, "body");
		} catch (err) {
			console.error(err);
			throw new InvalidInput(err.message);
		}

		log = await db.logs.findOneAndUpdate({
			_id: logId,
		}, {
			$push: {
				"lifts": lift,
			},
		});

		res.send(log);
	} catch (err) {
		next(err);
	}
});

router.delete("/:id/:index", async (req, res, next) => {
	try {
		const { index, id } = req.params;

		const logId = id === "active"
			? req.user.activeLogId
			: id;

		if (/\D/.test(index))
			throw new InvalidInput("Index must be a positive integer");

		const liftsDotIndex = "lifts." + index;

		const updated = await db.logs.update({ _id: logId },
			{ $unset: { [liftsDotIndex]: 1 } });
		await db.logs.update({ _id: logId },
			{ $pull: { lifts: null } });

		if (updated.nModified === 0)
			throw new InvalidInput("No such log exists or invalid index");

		res.send({});
	} catch (err) {
		next(err);
	}
});

router.delete("/:id", async (req, res, next) => {
	try {
		const logId = req.params.id === "active"
			? req.user.activeLogId
			: req.params.id;

		if (req.params.id === "active") {
			if (!req.user.activeLogId)
				throw new InvalidInput("No active log exists");

			await db.accounts.findOneAndUpdate({
				_id: req.user._id,
			}, {
				$set: { activeLogId: null },
			});
		}

		const deleted = await db.logs.findOneAndDelete(
			{ _id: logId },
		);

		if (!deleted) throw new InvalidInput("No such log exists");

		res.send({});
	} catch (err) {
		next(err);
	}
});

export default router;
