import { Account } from "./db";

declare global {
	namespace Express {
		interface Request {
			user: Account;
		}
	}
}
