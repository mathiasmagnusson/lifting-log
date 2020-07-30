<style>
	section {
		position: absolute;
		bottom: 0;
		right: 20%;
		width: 60%;
	}

	p {
		padding: 5px;
		border-radius: 4px;
		margin: 5px;
	}

	.error {
		background-color: var(--nord11);
	}

	.message {
		background-color: var(--nord14);
	}
</style>

<script lang="ts">
	import { messages } from "./message";
</script>

<section>
	{#each $messages as { message, type }}
		<p
			class:error={type === "error"}
			class:message={type === "message"}
		>{message}</p>
	{/each}
</section>
