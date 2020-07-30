<style>
</style>

<script lang="ts">
	import Login from "./Login.svelte";
	import Home from "./Home.svelte";
	import Message from "./Message.svelte";
	import { loggedIn } from "./api";
</script>

{#await $loggedIn}
	<p>Loading...</p>
{:then loggedIn}
	{#if loggedIn}
		<Home />
	{:else}
		<Login />
	{/if}
{:catch}
	<p>Cannot contact server :(</p>
{/await}
<Message />
