<script lang="ts">
    import { page } from "$app/state";
    import { setInstanceContext } from "$lib/context/instance";
    import type { Snippet } from "svelte";
    import type { LayoutData } from "./$types";

    let { data, children }: { data: LayoutData, children: Snippet } = $props();

    const instance = $derived(data.settings.canvasInstances.find(i => i.id === page.params.instanceId));

    // @ts-ignore - we lie to ts a little here because we'll never read instance if it's undefined
    // svelte-ignore state_referenced_locally
    let instanceContext = $state<InstanceContext>({ instance });
    setInstanceContext(instanceContext);
    $effect(() => {
        if(instance) instanceContext.instance = instance;
    });
</script>

{#if instance}
    {@render children()}
{:else}
    <p class="-empty">Unknown instance ID: {page.params.instanceId}</p>
{/if}