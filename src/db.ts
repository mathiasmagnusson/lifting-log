import monk from "monk";

import validateStructure from "./validate";

const db = monk("localhost/lifting-log");

export interface Account {
	_id: string;
	username: string;
	password: string;
	session?: {
		id: string;
		lastActivity: number;
	};
	activeLogId?: string;
}
export const accounts = db.get<Account>("accounts");
accounts.createIndex({ username: 1 }, { unique: true });

export interface Log {
	_id: string;
	accountId: string;
	startTime: number;
	endTime?: number;
	lifts: Lift[];
}
export const logs = db.get<Log>("logs");

export interface Lift {
	exerciseId: string;
	weight: number;
	sets: number;
	reps: number;
}

export const validateLift = validateStructure({
	exerciseId: { $type: String, $length: 24, $func: (_id: string) => exercises.findOne({ _id }) },
	weight: { $type: Number, $min: 0, $integer: true },
	sets: { $type: Number, $min: 0, $integer: true },
	reps: { $type: Number, $min: 0, $integer: true },
});

export interface Exercise {
	_id: string;
	name: string;
}
export const exercises = db.get<Exercise>("exercises");
