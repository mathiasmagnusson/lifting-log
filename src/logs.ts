import express from "express";

import * as db from "./db";
import { InvalidUserState, InvalidInput } from "./errors";

const router = express.Router();

interface PopulatedLog {
	_id: string;
	startTime: number;
	endTime?: number;
	lifts: PopulatedLift[];
}

interface PopulatedLift {
	exercise: string;
	weight: number;
	sets: number;
	reps: number;
}

async function populateLog(log?: db.Log): Promise<PopulatedLog | null> {
	if (!log) return null;
	const logs = await populateLogs([log]);
	return logs[0];
}

async function populateLogs(logs: db.Log[]): Promise<PopulatedLog[]> {
	const exercises = new Map<string, [number, number][]>();
	for (let i = 0; i < logs.length; i++) {
		const log = logs[i];
		for (let j = 0; j < log.lifts.length; j++) {
			const lifts = log.lifts[j];
			if (!exercises.has(lifts.exerciseId))
				exercises.set(lifts.exerciseId, []);
			exercises.get(lifts.exerciseId)?.push([i, j]);
		}
	}

	const populatedLogs: PopulatedLog[] = [];

	for (const log of logs) {
		populatedLogs.push({
			_id: log._id,
			startTime: log.startTime,
			endTime: log.endTime,
			lifts: log.lifts.map(lift => ({
				exercise: "",
				weight: lift.weight,
				sets: lift.sets,
				reps: lift.reps,
			})),
		});
	}

	for (const [id, indices] of exercises.entries()) {
		const exercise = await db.exercises.findOne({
			_id: id,
		});

		if (!exercise) throw new Error();

		const name = exercise.name;

		for (const [i, j] of indices) {
			populatedLogs[i].lifts[j].exercise = name;
		}
	}

	return populatedLogs;
}

/**
 * Get users finished logs
 */
router.get("/", async (req, res, next) => {
	try {
		const logs = await db.logs.find({
			accountId: req.user._id,
			_id: { $ne: req.user.activeLogId },
		});

		res.send(await populateLogs(logs));
	} catch (err) {
		next(err);
	}
});

/**
 * Start a new log
 */
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

/**
 * Finish active log or delete if empty
 */
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

/**
 * Get log by id or `active`
 */
router.get("/:id", async (req, res, next) => {
	try {
		const logId = req.params.id === "active"
			? req.user.activeLogId
			: req.params.id;

		const log = await db.logs.findOne({ _id: logId });

		if (!log) return res.send("null");

		const populatedLog = await populateLog(log);

		console.log(populatedLog);
		res.send(populatedLog);
	} catch (err) {
		next(err);
	}
});

/**
 * Add lift to log by id or `active`
 */
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

		res.send(await populateLog(log));
	} catch (err) {
		next(err);
	}
});

/**
 * Delete lift from log by id or `active`, and index of lift
 */
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

/**
 * Delete log
 */
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
