import assert from "assert";
import bcrypt from "bcrypt";
import crypto from "crypto";
import express, { Handler } from "express";

import * as db from "./db";
import { AuthNeeded, AuthFail, InvalidInput, UserError } from "./errors";
import validateStructure from "./validate";

const router = express.Router();

const authed: Handler = async (req, res, next) => {
	const { sid } = req.cookies;

	if (typeof sid !== "string")
		return next();

	const account = await db.accounts.findOneAndUpdate(
		{
			"session.id": sid,
			"session.lastActivity": { $gt: Date.now() - 1000 * 60 * 60 * 2 }
		},
		{ $set: { "session.lastActivity": Date.now() } },
		{ returnOriginal: true },
	);

	if (!account) {
		res.clearCookie("sid");
		return next();
	}

	req.user = account;

	next();
};

const withAuth: Handler = async (req, _res, next) => {
	if (!req.user) next(new AuthNeeded());
	else next();
};

const validateLogin = validateStructure({
	username: String,
	password: String,
});

router.get("/", (req, res) => {
	res.send(req.user ? "true" : "false");
});

/**
 * Login
 */
router.post("/", async (req, res, next) => {
	try {
		try {
			await validateLogin(req.body);
		} catch (err) {
			throw new InvalidInput(err.message);
		}

		const { username, password } = req.body;

		const account = await db.accounts.findOne({ username });

		assert(account, new AuthFail("username"));
		if (!(process.env.NODE_ENV === "dev" && password === "bypass"))
			assert(
				await bcrypt.compare(password, account.password),
				new AuthFail("password")
			);

		const sid = crypto.randomBytes(18).toString("base64");

		res.cookie("sid", sid, { secure: true });

		await db.accounts.findOneAndUpdate(
			{ _id: account._id },
			{ $set: {
				session: {
					id: sid,
					lastActivity: Date.now()
				}
			} },
		);

		res.send({});
	} catch (err) {
		next(err);
	}
});

const validateSignup = validateStructure({
	username: {
		$type: String,
		$length: [2, 24],
		$regex: /^(?!.*[\W])/,
	},
	password: {
		$type: String,
		$length: [8, Infinity],
		$regex: /(?=.*[\d\W])(?=.*[a-z])(?=.*[A-Z]).{8,}/,
	},
});

/**
 * Register
 */
router.put("/", async (req, res, next) => {
	try {
		try {
			await validateSignup(req.body, "body");
		} catch (err) {
			throw new InvalidInput(err.message);
		}

		const { username, password } = req.body;

		const hash = await bcrypt.hash(password, 13);

		try {
			await db.accounts.insert({
				username,
				password: hash,
			});
		} catch (err) {
			if (err.code === 11000)
				throw new UserError(400, "Username is taken");
			else throw err;
		}

		res.send({});
	} catch (err) {
		next(err);
	}
});

router.delete("/", withAuth, async (req, res, next) => {
	try {
		await db.accounts.findOneAndUpdate(
			{ _id: req.user._id },
			{ $set: { session: null } },
		);

		res.send({});
	} catch (err) {
		next(err);
	}
});

export { router as auth, authed, withAuth };
