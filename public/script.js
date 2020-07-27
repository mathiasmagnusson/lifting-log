const headers = { "Content-Type": "application/json" };

const loginForm = document.querySelector(".login");
const loginOutput = document.querySelector(".login .output");

loginForm.addEventListener("submit", async event => {
	event.preventDefault();

	loginOutput.textContent = "";

	const data = new FormData(loginForm);

	const username = data.get("username");
	const password = data.get("password");

	const res = await fetch("/auth", {
		method: "post",
		headers,
		body: JSON.stringify({
			username,
			password,
		}),
	});

	const json = await res.json();

	loginOutput.textContent = JSON.stringify(json, null, 4);

	if (res.status !== 200)
		loginOutput.classList.add("error");
	else
		loginOutput.classList.remove("error");
});

const registerForm = document.querySelector(".register");
const registerOutput = document.querySelector(".register .output");

registerForm.addEventListener("submit", async event => {
	event.preventDefault();

	registerOutput.textContent = "";

	const data = new FormData(registerForm);

	const username = data.get("username");
	const password = data.get("new-password");

	const res = await fetch("/auth", {
		method: "put",
		headers,
		body: JSON.stringify({
			username,
			password,
		}),
	});

	const json = await res.json();

	registerOutput.textContent = JSON.stringify(json, null, 4);

	if (res.status !== 200)
		registerOutput.classList.add("error");
	else
		registerOutput.classList.remove("error");
});

const logoutButton = document.querySelector(".logout button");
const logoutOutput = document.querySelector(".logout pre");

logoutButton.addEventListener("click", async () => {
	logoutOutput.textContent = "";

	const res = await fetch("/auth", {
		method: "delete",
		headers,
	});

	const json = await res.json();

	logoutOutput.textContent = JSON.stringify(json, null, 4);

	if (res.status !== 200)
		logoutOutput.classList.add("error");
	else
		logoutOutput.classList.remove("error");
});

const startActiveLog = document.querySelector(".active-log .start");
const getActiveLog = document.querySelector(".active-log .get");
const finishActiveLog = document.querySelector(".active-log .finish");
const addToActiveLog = document.querySelector(".active-log .add");
const activeLog = document.querySelector(".active-log pre");

startActiveLog.addEventListener("click", async () => {
	activeLog.textContent = "";

	const res = await fetch("/logs", {
		method: "post",
		headers,
	});

	const json = await res.json();

	activeLog.textContent = JSON.stringify(json, null, 4);

	if (res.status !== 200)
		activeLog.classList.add("error");
	else
		activeLog.classList.remove("error");
});

getActiveLog.addEventListener("click", async () => {
	activeLog.textContent = "";

	const res = await fetch("/logs/active", { headers });
	const json = await res.json();

	activeLog.textContent = JSON.stringify(json, null, 4);

	if (res.status !== 200)
		activeLog.classList.add("error");
	else
		activeLog.classList.remove("error");
});

finishActiveLog.addEventListener("click", async () => {
	activeLog.textContent = "";

	const res = await fetch("/logs/finish", {
		method: "post",
		headers,
	});
	const json = await res.json();

	activeLog.textContent = JSON.stringify(json, null, 4);

	if (res.status !== 200)
		activeLog.classList.add("error");
	else
		activeLog.classList.remove("error");
});

addToActiveLog.addEventListener("submit", async event => {
	event.preventDefault();

	activeLog.textContent = "";

	const body = Object.fromEntries(new FormData(addToActiveLog));

	let res = await fetch("/exercises/" + encodeURIComponent(body.exercise));
	let exercises = await res.json();
	if (exercises.length === 0) {
		activeLog.textContent = "No exercise found";
		activeLog.classList.add("error");
		return;
	}
	body.exerciseId = exercises[0]._id;
	delete body.exercise;

	for (const key of ["weight", "sets", "reps"])
		body[key] = Number.parseInt(body[key]);

	console.log(body);

	res = await fetch("/logs/active", {
		method: "post",
		headers,
		body: JSON.stringify(body),
	});

	const json = await res.json();

	activeLog.textContent = JSON.stringify(json, null, 4);

	if (res.status !== 200)
		activeLog.classList.add("error");
	else
		activeLog.classList.remove("error");
});

const getLogs = document.querySelector(".logs .get");
const logs = document.querySelector(".logs ul");
const logsDbg = document.querySelector(".logs pre");

getLogs.addEventListener("click", async () => {
	logs.textContent = "";
	logsDbg.textContent = "";

	const res = await fetch("/logs", { headers });
	const json = await res.json();

	if (res.status !== 200) {
		logsDbg.textContent = JSON.stringify(json, null, 4);
		logsDbg.classList.add("error");
		return;
	} else logsDbg.classList.remove("error");

	for (const log of json) {
		const li = document.createElement("li");
		const [idP, startP, endP] = new Array(3).fill().map(() => document.createElement("p"));
		const liftsUl = document.createElement("ul");
		for (const e of [idP, startP, endP, liftsUl]) li.appendChild(e);
		logs.appendChild(li);

		li.style.border = "2px solid black";

		startP.textContent = "Start: " + new Date(log.startTime).toLocaleString();
		endP.textContent   = "End: " + new Date(log.endTime).toLocaleString();

		log.lifts.map(async lift => {
			const p = document.createElement("p");

			p.textContent = `${lift.exercise} - ${lift.sets}×${lift.reps}, ${lift.weight} kg`;

			const liftLi = document.createElement("li");
			liftLi.appendChild(p);
			liftsUl.appendChild(liftLi);
		});

	}
});
