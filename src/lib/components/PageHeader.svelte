<script lang="ts">
    import ChevronRight from "@lucide/svelte/icons/chevron-right";

    const { category, title, count }: {
        category?: string,
        title: string,
        count?: number
    } = $props();
</script>

<header class="page-header">
    <span class="separator"><ChevronRight /></span>
    {#if category}
        <span class="category">{category}</span>
        <span class="separator"><ChevronRight /></span>
    {/if}
    <h1>{title}</h1>
    {#if count}<span class="count">({count})</span>{/if}
</header>

<style lang="scss">
.page-header {
    h1 {
        display: inline;
        margin: 0;
    }
    .separator {
        display: inline-block;
        color: var(--text-muted);
        opacity: 0.5;
        width: 1rem;

        &:first-child {
            margin-left: -1.5rem;
        }
        > :global(svg) {
            width: 0.75rem;
            height: 0.75rem;
        }
    }
    .category {
        color: var(--text-muted);
        font-size: var(--font-lg);
    }
    .count {
        color: var(--text-muted);
        font-size: var(--font-md);
    }
}
</style>