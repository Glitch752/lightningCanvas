<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import type { CanvasModule, CanvasModuleItem } from "$lib/server/canvas/modules";
    import CourseItemIcon from "$lib/components/CourseItemIcon.svelte";
    import ExpandableSection from "$lib/components/ExpandableSection.svelte";
    import { page } from "$app/state";
    import { getInstanceContext } from "$lib/context/instance";

    // TODO: persist collapsed state, ideally on the server but maybe just in local storage
    
    const { modules }: { modules: CanvasModule[] } = $props();
    const instance = getInstanceContext().instance;

	function itemHref(item: CanvasModuleItem): string | undefined {
        if(item.type === "SubHeader") return undefined;
		if(item.type === "Page" && item.page_url) return `/instances/${page.params.instanceId}/course/${page.params.courseId}/pages/${item.page_url}`;
		if(item.type === "Assignment" && item.content_id) return `/instances/${page.params.instanceId}/course/${page.params.courseId}/assignments/${item.content_id}`;
        if(item.type === "Quiz" && item.content_id) return `${instance.hostname}/courses/${page.params.courseId}/quizzes/${item.content_id}`;
        if(item.type === "Discussion" && item.content_id) return `${instance.hostname}/courses/${page.params.courseId}/discussion_topics/${item.content_id}`;
		return item.external_url ?? item.url;
	}

	function itemIsExternal(item: CanvasModuleItem): boolean {
		return Boolean(item.external_url) || ["ExternalUrl", "File", "Quiz", "Discussion"].includes(item.type);
	}
</script>

<ExpandableSection
    sections={modules}
    getId={(module) => module.id}
    getTitle={(module) => module.name}
    getCount={(module) => {
        const count = module.items.length;
        return `${count} ${count === 1 ? "item" : "items"}`;
    }}
>
    {#snippet children(section)}
        {@const mod = section as CanvasModule}
        <div class="module-items">
            {#each mod.items.toSorted((a, b) => a.position - b.position) as item (item.id)}
                {@const href = itemHref(item)}
                {#if href}
                    <a
                        class="module-item -hflex -input -flat"
                        style={`--indent: ${item.indent ?? 0}`}
                        
                        href={href}
                        data-type={item.type}
                        target={itemIsExternal(item) ? "_blank" : undefined}
                        rel={itemIsExternal(item) ? "noreferrer" : undefined}
                    >
                        <CourseItemIcon type={item.type} />
                        {#if href}
                            <span class="item-title">{item.title}</span>
                        {:else}
                            <span class="item-title">{item.title}</span>
                        {/if}
                        {#if item.completion_requirement?.completed}<Check class="-success" />{/if}
                    </a>
                {:else}
                    <div
                        class="module-item -hflex"
                        style={`--indent: ${item.indent ?? 0}`}
                        data-type={item.type}
                    >
                        <CourseItemIcon type={item.type} />
                        <span class="item-title">{item.title}</span>
                        {#if item.completion_requirement?.completed}<Check class="-success" />{/if}
                    </div>
                {/if}
            {/each}
        </div>
    {/snippet}
</ExpandableSection>

<style lang="scss">
.module-item {
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem 0.5rem calc(1rem + var(--indent, 0) * 1.25rem);

    min-width: 0;
    flex: 1;
    text-decoration: underline var(--text-muted);
    ---bg: transparent;

    &[data-type="ExternalUrl"] {
        ---text: var(--primary);
    }
    &[data-type="Page"] {
        ---text: var(--text-muted);
    }
    &[data-type="SubHeader"] {
        text-decoration: none;
        font-weight: bold;
    }
    
    &:not(:first-child) {
        border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    }

    .item-title {
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
    }
}
</style>