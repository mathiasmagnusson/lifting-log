import express from "express";
import assert from "assert";

import * as db from "./db";
import { InvalidInput } from "./errors";

const router = express.Router();

/**
 * List all exercises
 */
router.get("/", async (_req, res, next) => {
	try {
		const exercises = await db.exercises.find();

		res.send(exercises);
	} catch (err) {
		next(err);
	}
});

/**
 * List all exercises matching query or by id
 */
router.get("/:query", async (req, res, next) => {
	try {
		const { query } = req.params;

		try {
			const byId = await db.exercises.findOne({
				_id: query,
			});
			if (byId)
				return res.send([byId]);
		} catch (err) { /* */ }

		const exact = await db.exercises.findOne({
			name: query,
		});

		if (exact) return res.send([exact]);

		const exercises = await db.exercises.find({
			name: new RegExp(query, "i"),
		});

		res.send(exercises);
	} catch (err) {
		next(err);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const name = req.body.name;
		assert(typeof name === "string", new InvalidInput("body.name must be a string"));

		const exercise = await db.exercises.insert({ name });

		res.send(exercise);
	} catch (err) {
		next(err);
	}
});

export default router;
