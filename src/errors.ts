import { ErrorRequestHandler } from "express";

export class UserError extends Error {
	constructor(public status: number, message: string) {
		super(message);
	}
}

export class InvalidInput extends UserError {
	constructor(message: string) {
		super(400, message);
	}
}

export class AuthFail extends UserError {
	constructor(cause: "username" | "password") {
		super(422, `Invalid ${cause}`);
	}
}

export class AuthNeeded extends UserError {
	constructor() {
		super(401, "User must be logged in");
	}
}

export class InvalidUserState extends UserError {
	constructor(message: string) {
		super(409, message);
	}
}

// eslint-disable-next-line
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	res.status(err.status ?? 500)
		.send(req.header("Content-Type")?.includes("json")
			? { message: err.message || "Internal server error" }
			: `Error: ${err.message}`
		);
};
