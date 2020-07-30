<style>
	div {
		height: calc(100% - 64px);
		margin-bottom: 64px;
		width: 100%;
		overflow: auto;
	}

	nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 64px;
		background-color: var(--nord1);
		display: flex;
		justify-content: stretch;
	}

	button {
		background: none;
		border: none;
		font-size: 36px;
		height: 100%;
		width: -moz-available;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.selected {
		background-color: var(--nord2);
	}

	i {
		color: var(--nord7);
	}
</style>

<script lang="ts">
	import ActiveLog from "./ActiveLog.svelte";
	import Logs from "./Logs.svelte";

	let state: "active" | "logs" = "active";
</script>

<div>
	{#if state === "active"}
		<ActiveLog />
	{:else}
		<Logs />
	{/if}
</div>

<nav>
	<button
		class:selected={state === "active"}
		on:click={() => state = "active"}
	>
		<i class="fas fa-dumbbell"></i>
	</button>
	<button
		class:selected={state === "logs"}
		on:click={() => state = "logs"}
	>
		<i class="fas fa-book"></i>
	</button>
</nav>
