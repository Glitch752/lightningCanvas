<script lang="ts" generics="T">
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import { SvelteSet } from "svelte/reactivity";
    import type { Snippet } from "svelte";

    let {
        sections,
        getId,
        getTitle,
        getCount,
        children
    }: {
        sections: T[];
        getId: (section: T) => number | string;
        getTitle: (section: T) => string;
        getCount?: (section: T) => string;
        children: Snippet<[T]>;
    } = $props();

    let expanded = $derived(new SvelteSet(sections.map(getId)));

    function toggle(id: number | string): void {
        if(expanded.has(id)) expanded.delete(id);
        else expanded.add(id);
    }
</script>

<div class="expandable-sections -vflex">
    {#each sections as section (getId(section))}
        {@const id = getId(section)}
        {@const isExpanded = expanded.has(id)}
        <section class="expandable-section -card" class:expanded={isExpanded}>
            <button
                class="section-header -hflex"
                onclick={() => toggle(id)}
                aria-expanded={isExpanded}
            >
                {#if isExpanded}<ChevronDown />{:else}<ChevronRight />{/if}
                <span class="section-title">{getTitle(section)}</span>
                {#if getCount}<span class="section-count">{getCount(section)}</span>{/if}
            </button>
            {#if isExpanded}
                <div class="section-content">
                    {@render children(section)}
                </div>
            {/if}
        </section>
    {/each}
</div>

<style lang="scss">
.expandable-sections {
    gap: 1rem;
    padding-bottom: 16rem;
}
.expandable-section {
    overflow: hidden;

    .section-header {
        border: none;
        gap: 0.5rem;
        width: 100%;
        align-items: center;
        border-radius: 0;
        text-align: left;
        cursor: pointer;
        font-weight: bold;

        .section-title { flex: 1; }
        .section-count {
            color: var(--text-muted);
            font-size: var(--font-xs);
            font-weight: normal;
        }
    }
    .section-content { padding-top: 0.25rem; }
}
</style>
