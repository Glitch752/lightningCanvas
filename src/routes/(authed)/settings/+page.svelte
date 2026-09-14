<script lang="ts">
    import { FilePlusCorner } from "@lucide/svelte";
	import type { ActionData } from "./$types";
	import type { PageData } from "./$types";
    import { pageData } from "../../+layout.svelte";
    import { visualSettings, type VisualSettings } from "$lib/settings";
    import { enhance } from "$app/forms";

	let { data, form }: { data: PageData; form: ActionData } = $props();
    let canvasHostname = $derived(data.settings.canvasHostname);

    pageData(() => ({
        title: "Settings",
        canvasUrl: null
    }));
</script>

<div class="page -vflex">
	<h1>Settings</h1>
	<form
        method="POST"
        class="-vflex"
        use:enhance={() => {
            // this does work without turning off reset, but it avoids flashing
            return async ({ update }) => {
                await update({ reset: false });
            };
        }}
    >
		<div class="-label-inset">
			<label for="canvasHostname">Canvas hostname</label>
			<input
				id="canvasHostname"
				name="canvasHostname"
				type="url"
				placeholder="https://canvas.example.edu"
				bind:value={canvasHostname}
				required
			/>
		</div>
		<div class="-label-inset -hflex">
			<label for="canvasApiKey">Canvas API key</label>
			<input
				id="canvasApiKey"
				name="canvasApiKey"
				type="password"
				bind:value={data.settings.canvasApiKey}
				required
			/>
            {#if canvasHostname && new URL(canvasHostname).hostname}
                <a
                    class="-input -cgrid"
                    title="Get an API key on Canvas"
                    href="{canvasHostname}/profile/settings#access_tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <FilePlusCorner />
                </a>
            {/if}
		</div>

        <br />
        
        <h2>Visual</h2>
        {#each Object.entries(visualSettings) as [key, { label, default: defaultValue }]}
            <div class="flag-setting -hflex">
                <label for={"visual." + key}>{label}</label>
                <input
                    id={"visual." + key}
                    name={"visual." + key}
                    type="checkbox"
                    checked={data.settings.visual[key as keyof VisualSettings] ?? defaultValue}
                />
            </div>
        {/each}

        <br />
        
		<button type="submit">Save</button>
		{#if form?.saved}<p>Settings saved.</p>{/if}
		{#if form?.error}<p>{form.error}</p>{/if}
	</form>
</div>

<style lang="scss">
.page {
    gap: 1.5rem;
    width: min(100%, 600px);
}
form {
    gap: 1rem;

    button {
        padding: 0.5rem 1rem;
        width: fit-content;
    }

    > div {
        gap: 0.5rem;
        a {
            padding: 0.5rem;
            aspect-ratio: 1;
        }
    }

    .flag-setting {
        gap: 2rem;
        margin: -0.25rem 0;
    }
}
</style>