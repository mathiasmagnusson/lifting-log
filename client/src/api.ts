import { writable } from "svelte/store";

import { onMessage } from "./message";

const headers = { "Content-Type": "application/json" };

export const loggedIn = writable<Promise<boolean>>(initLogin());

async function initLogin () {
	const res = await fetch("/auth", { headers });
	return await res.json();
}

export async function login (username: string, password: string): Promise<boolean> {
	const res = await fetch("/auth", {
		method: "post",
		headers,
		body: JSON.stringify({
			username,
			password
		})
	});

	const json = await res.json();

	if (res.status === 200) {
		loggedIn.set(Promise.resolve(true));
		await updateActiveLog();
	} else {
		onMessage(json);
	}

	return res.status === 200;
}

export async function register (username: string, password: string): Promise<boolean> {
	const res = await fetch("/auth", {
		method: "put",
		headers,
		body: JSON.stringify({
			username,
			password
		})
	});

	const json = await res.json();

	if (res.status !== 200)
		onMessage(json);

	return res.status === 200;
}

export interface Log {
	_id: string;
	startTime: number;
	endTime?: number;
	lifts: Lift[];
}

export interface Lift {
	exercise: string;
	weight: number;
	sets: number;
	reps: number;
}

export const activeLog = writable<Log | null | "loading">("loading");
updateActiveLog();

async function updateActiveLog (): Promise<void> {
	const res = await fetch("/logs/active", { headers });

	const json = await res.json();

	if (res.status !== 200)
		onMessage(json);
	else
		activeLog.set(json);
}

export async function startLog (): Promise<boolean> {
	const res = await fetch("/logs", {
		method: "post",
		headers,
	});

	const json = await res.json();

	if (res.status !== 200)
		onMessage(json);
	else
		updateActiveLog();

	return res.status === 200;
}

export async function finishLog (): Promise<boolean> {
	const res = await fetch("/logs/finish", {
		method: "post",
		headers,
	});

	const json = await res.json();

	if (res.status !== 200)
		onMessage(json);
	else
		updateActiveLog();

	return res.status === 200;
}

export async function deleteLift (id: string, index: number): Promise<boolean> {
	const res = await fetch(`/logs/${id}/${index}`, {
		method: "delete",
		headers,
	});

	const json = await res.json();

	if (res.status !== 200)
		onMessage(json);
	else if (id === "active")
		updateActiveLog();

	return res.status === 200;
}

export async function addLift (
	id: string,
	lift: {
		exerciseId: string,
		weight: number,
		sets: number,
		reps: number,
	},
): Promise<boolean> {
	const res = await fetch(`/logs/${id}`, {
		method: "post",
		headers,
		body: JSON.stringify(lift),
	});

	const json = await res.json();

	if (res.status !== 200)
		onMessage(json)
	else if (id === "active")
		updateActiveLog();

	return res.status === 200;
}

export interface Exercise {
	_id: string;
	name: string;
}

export async function getExercises (): Promise<Exercise[]> {
	const res = await fetch("/exercises", { headers });

	const json = await res.json();

	if (res.status !== 200) {
		onMessage(json);
		return [];
	}

	return json;
}
