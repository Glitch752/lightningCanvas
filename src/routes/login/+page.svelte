<script lang="ts">
  	import { pageData } from '../+layout.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	pageData({
		title: "Login",
		canvasUrl: null
	});
</script>

<main class="-cgrid">
	<div class="login-form -card -vflex">
		<h1>Login</h1>
		
		<form method="POST" class="-vflex">
			<div class="-label-inset">
				<label for="password">Password</label>
				<input type="password" name="password" id="password" required />
			</div>
			<input type="hidden" name="redirectTo" value={form?.redirectTo ?? '/'} />
			<button type="submit">Log in</button>
			{#if form?.incorrect}
				<p>Incorrect password</p>
			{/if}
		</form>
	</div>
</main>

<style>
main {
	height: 100%;
}
.login-form {
	padding: 1rem;
	gap: 1.5rem;
	min-width: 300px;
}
form {
	gap: 0.5rem;
}
</style>