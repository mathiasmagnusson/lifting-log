<style>
	main {
		height: 100%;
		width: 80%;
		margin: 0 auto;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
	}

	.switch-state, .switch-state:focus {
		background: none;
		border: none;
		font-size: inherit;
		color: var(--nord8);
	}
</style>

<script lang="ts">
	import { onMessage } from "./message";
	import * as api from "./api";

	let username: string = "";
	let password: string = "";
	let repeatPassword: string = "";

	let state: "login" | "register" = "login";

	function switchState() {
		if (state === "login")
			state = "register";
		else
			state = "login";
	}

	function submit() {
		if (state === "login")
			login();
		else
			register();
	}

	async function login() {
		const success = await api.login(username, password);
		if (success) {
			onMessage({ message: "Logged in", type: "message" });
		}
	}

	async function register() {
		if (repeatPassword !== password)
			return onMessage({ message: "Passwords don't match", type: "error" });

		const success = await api.register(username, password);
		if (success) {
			onMessage({ message: "Registered", type: "message" });
			state = "login";
		}
	}
</script>

<main>
	<form on:submit|preventDefault={submit}>
		<section>
			<label for="username">Username:</label>
			<input type="text" id="username" bind:value={username} />
		</section>

		<section>
			<label for="password">Password:</label>
			<input type="password" id="password" bind:value={password} />
		</section>

		{#if state === "register"}
			<section>
				<label for="repeat-password">Repeat password:</label>
				<input
					type="password"
					id="repeat-password"
					bind:value={repeatPassword}
				/>
			</section>
		{/if}

		<section>
			<button>
				{#if state === "login"}
					Log in
				{:else}
					Register
				{/if}
			</button>
		</section>
	</form>
	<p>
		{#if state === "login"}
			New here?
		{:else}
			Already registered?
		{/if}
		<button class="switch-state" on:click={switchState}>
			{#if state === "login"}
				Create an account!
			{:else}
				Log in!
			{/if}
		</button>
	</p>
</main>
