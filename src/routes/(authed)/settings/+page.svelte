<script lang="ts">
    import FilePlusCorner from "@lucide/svelte/icons/file-plus-corner";
    import Plus from "@lucide/svelte/icons/plus";
    import Trash from "@lucide/svelte/icons/trash";
	import type { ActionData } from "./$types";
	import type { PageData } from "./$types";
    import { visualSettings, type VisualSettings } from "$lib/settings";
    import { enhance } from "$app/forms";
    import { pageData } from "$lib/pageData.svelte";

	let { data, form }: { data: PageData; form: ActionData } = $props();

    pageData(() => ({
        title: "Settings",
        canvasUrl: null
    }));

    function copyInstances(source: typeof data.settings.canvasInstances) {
        return source.map(instance => ({ ...instance }));
    }
    let instances = $state<typeof data.settings.canvasInstances>([]);
    $effect(() => {
        instances = copyInstances(data.settings.canvasInstances);
    });

    function addInstance() {
        instances.push({ name: "", hostname: "https://", apiKey: "", id: "" });
    }
    function removeInstance(index: number) {
        instances.splice(index, 1);
    }
    function isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
</script>

<div class="page">
    <section class="main -vflex">
        <h1>Settings</h1>
        <form
            method="POST" action="?/saveSettings"
            class="-vflex"
            use:enhance={() => {
                // this does work without turning off reset, but it avoids flashing
                return async ({ update }) => {
                    await update({ reset: false });
                };
            }}
        >
            <h2>Canvas instances</h2>
            <!-- this feels... wrong, but i guess it's the right way to do it? -->
            <input type="hidden" name="instanceCount" value={instances.length} />
            {#each instances as instance, index}
                <fieldset class="instance -vflex">
                    <legend>Instance {index + 1}</legend>
                    <div class="-label-inset -hflex">
                        <label for={`instance-${index}-name`}>Name</label>
                        <input id={`instance-${index}-name`} name={`instance.${index}.name`} bind:value={instance.name} required />
                        <button type="button" class="remove -cgrid" onclick={() => removeInstance(index)} title="Remove instance">
                            <Trash />
                        </button>
                    </div>
                    <div class="-label-inset">
                        <label for={`instance-${index}-hostname`}>Canvas hostname</label>
                        <input id={`instance-${index}-hostname`} name={`instance.${index}.hostname`} type="url" bind:value={instance.hostname} required />
                    </div>
                    <div class="-label-inset -hflex">
                        <label for={`instance-${index}-api-key`}>Canvas API key</label>
                        <input id={`instance-${index}-api-key`} name={`instance.${index}.apiKey`} type="password" bind:value={instance.apiKey} required />
                        {#if isValidUrl(instance.hostname)}
                            <a class="-input -cgrid" title="Get an API key on Canvas" href={`${instance.hostname}/profile/settings#access_tokens`} target="_blank" rel="noopener noreferrer">
                                <FilePlusCorner />
                            </a>
                        {/if}
                    </div>
                </fieldset>
            {/each}
            <button class="add" type="button" onclick={addInstance}><Plus /> Add instance</button>
    
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
    </section>
    <section class="-vflex">
        <h2>Debug</h2>
        <div class="debug-button -hflex">
            <form method="POST" action="?/clearCache" use:enhance>
                <button type="submit">Clear cache</button>
            </form>
            {#if form?.cacheCleared}
                <p>{form.message}</p>
            {/if}
        </div>
    </section>
</div>

<style lang="scss">
.page {
    display: grid;
    grid-template-columns: 40rem 1fr;
    gap: 2rem;

    section {
        gap: 1.5rem;
    }
    section.main {
        max-width: 48rem;
    }
    .debug-button {
        align-items: center;
        gap: 1.5rem;
    }
}
@media (max-width: 1000px) {
    .page {
        grid-template-columns: 1fr;
    }
}

form {
    gap: 0.75rem;

    h2:not(:first-child) {
        margin-top: 1rem;
    }
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
        label {
            flex: 1;
        }
    }

    .flag-setting {
        gap: 2rem;
        margin: -0.25rem 0;
    }

    .add {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .remove {
        color: var(--danger);
        padding: 0;
        aspect-ratio: 1;
    }

    fieldset .-hflex {
        gap: 0.5rem;
    }
}
</style>