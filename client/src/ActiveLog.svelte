<style>
	main {
		padding: 40px 0;
	}

	.controls {
		display: flex;
		justify-content: center;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		width: 80%;
		margin: 0 auto;
		margin-bottom: 20px;
	}

	.controls.full {
		height: 100%;
	}

	select, option {
		text-transform: capitalize;
	}

	.controls > button, select, input {
		width: 100%;
	}

	.weight {
		display: flex;
		flex-direction: row;
		gap: 10px;
	}

	.weight input {
		width: calc(100% - 2 * (10px + 70px));
	}

	.weight button {
		flex-shrink: 0;
		width: 70px;
	}

	.sets-reps {
		display: flex;
		flex-direction: row;
		justify-content: center;
		font-size: 32px;
	}

	.sets-reps-btns {
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.sets-reps-btns div {
		display: flex;
		flex-direction: row;
		justify-content: center;
		gap: 10px;
	}

	.sets-reps-btns button {
		width: 60px;
	}

	.fa-stopwatch {
		color: var(--nord6);
		font-size: 1.2em;
	}

	.log {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	ul {
		list-style: none;
		width: 80%;
		margin-top: 10px;
	}

	li {
		padding: 10px 15px;
		font-size: 20px;
		background-color: var(--nord1);
		margin: 10px 0;
		border-radius: 5px;
		display: flex;
		align-items: center;
	}

	.txt {
		text-transform: capitalize;
	}

	li i {
		margin-left: auto;
		color: var(--nord9);
		padding: 10px;
		margin: -10px -10px -10px auto;
	}
</style>

<script lang="ts">
	import { derived } from "svelte/store";

	import {
		activeLog,
		startLog,
		finishLog,
		deleteLift,
		getExercises,
		addLift
	} from "./api";
	import type { Log } from "./api";
	import Loading from "./Loading.svelte";
	import { onMessage } from "./message";

	let log: Log | null | "loading";
	activeLog.subscribe(_log => log = _log);

	const duration = derived(activeLog, ($activeLog, set) => {
		if (!$activeLog || $activeLog === "loading") return;

		const setDuration = () => {
			const d = Date.now() - $activeLog.startTime;
			const hours = Math.floor(d / 1000 / 60 / 60);
			const minutes = Math.floor(d / 1000 / 60) % 60;
			set(
				hours > 0
					? (hours + ":" + minutes.toString().padStart(2, "0"))
					: (minutes + " minutes")
			);
		};
		setDuration();
		const interval = setInterval(setDuration, 1000 * 10);

		return () => clearInterval(interval);
	}, "");

	const removeLift = (index: number) => deleteLift('active', index);

	let exerciseId: string | null = null;
	let weight: number = 80;
	let sets = 5;
	let reps = 5;

	function newLift() {
		if (exerciseId === null)
			return onMessage({
				message: "Select an exercise first",
				type: "error"
			})

		addLift("active", {
			exerciseId,
			weight,
			sets,
			reps,
		});
	}
</script>

<main>
	{#if log === "loading"}
		<Loading />
	{:else if log === null}
		<section class="controls full">
			<button on:click={startLog}>Start log</button>
		</section>
	{:else if log.lifts}
		<section class="controls">
			<button on:click={finishLog}>Finish log</button>

			{#await getExercises()}
				<Loading />
			{:then exercises}
				<select bind:value={exerciseId}>
					<option value={null}>
						Select exercise
					</option>
					{#each exercises as exercise}
						<option value={exercise._id}>
							{exercise.name}
						</option>
					{/each}
				</select>
			{/await}

			<section class="weight">
				<button on:click={() => weight -= 5}>-5</button>
				<input type="number" bind:value={weight} />
				<button on:click={() => weight += 5}>+5</button>
			</section>

			<section class="sets-reps">
				<span class="sets">{sets} sets, {reps} reps</span>
			</section>

			<section class="sets-reps-btns">
				<div>
					<button class="adjust" on:click={() => sets--}>-</button>
					<button class="adjust" on:click={() => sets++}>+</button>
				</div>
				<div>
					<button class="adjust" on:click={() => reps--}>-</button>
					<button class="adjust" on:click={() => reps++}>+</button>
				</div>
			</section>

			<button on:click={newLift}>Add lift</button>
		</section>
		<section class="log">
			<p><i class="fas fa-stopwatch"></i> {$duration}</p>
			<ul>
				{#each log.lifts as { exercise, weight, sets, reps }, i}
					<li>
						<span class="txt">
							{exercise}, {sets}×{reps} @ {weight}kg
						</span>
						<i on:click={() => removeLift(i)} class="far fa-trash-alt"></i>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>
