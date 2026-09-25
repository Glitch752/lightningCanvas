<script lang="ts">
    import type { Snippet } from "svelte";

    const { type = "component", children }: { type?: string, children: Snippet } = $props();
</script>

<svelte:boundary onerror={(error) => console.error("Page rendering failed", error)}>
    {#snippet failed(error: any, reset)}
        <section class="-render-error -vflex" role="alert">
            <h2>Error displaying {type}</h2>
            <p>{error.message ?? String(error)}</p>
            {#if error.stack}
                <pre>{error.stack.split('\n').slice(0, 20).join('\n')}</pre>
            {/if}
            <button onclick={reset}>Try again</button>
        </section>
    {/snippet}
    {@render children()}
</svelte:boundary>