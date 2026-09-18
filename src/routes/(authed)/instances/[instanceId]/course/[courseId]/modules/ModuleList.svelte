<script lang="ts">
	import BookOpen from "@lucide/svelte/icons/book-open";
	import Check from "@lucide/svelte/icons/check";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import CircleQuestionMark from "@lucide/svelte/icons/circle-question-mark";
	import ClipboardList from "@lucide/svelte/icons/clipboard-list";
	import ExternalLink from "@lucide/svelte/icons/external-link";
	import FileText from "@lucide/svelte/icons/file-text";
	import MessageSquare from "@lucide/svelte/icons/message-square";
	import Paperclip from "@lucide/svelte/icons/paperclip";
	import Pencil from "@lucide/svelte/icons/pencil";
	import type { CanvasModule, CanvasModuleItem } from "$lib/server/canvas/modules";
	import type { CanvasModuleItemType } from "$lib/server/canvas/modules";
    import { page } from "$app/state";
    import { getInstanceContext } from "$lib/context/instance";
    import { SvelteSet } from "svelte/reactivity";

    const { modules }: { modules: CanvasModule[] } = $props();
    const instance = getInstanceContext().instance;

    // TODO: persist collapsed state, ideally on the server but maybe just in local storage
    let expanded = $derived(new SvelteSet<number>(modules.map(m => m.id) ?? []));
	function toggle(moduleId: number): void {
		if(expanded.has(moduleId)) expanded.delete(moduleId);
		else expanded.add(moduleId);
	}

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
    
	const icons: {
        [key in CanvasModuleItemType]: typeof BookOpen
    } = {
        File: Paperclip,
        Page: FileText,
        Discussion: MessageSquare,
        Assignment: ClipboardList,
        Quiz: CircleQuestionMark,
        ExternalUrl: ExternalLink,
        SubHeader: Pencil
    };
</script>

<div class="module-list -vflex">
    {#each modules as mod (mod.id)}
        <section class="module -card" class:expanded={expanded.has(mod.id)}>
            <button
                class="module-header -hflex"
                onclick={() => toggle(mod.id)}
                aria-expanded={expanded.has(mod.id)}
            >
                {#if expanded.has(mod.id)}<ChevronDown />{:else}<ChevronRight />{/if}
                <span class="module-name">{mod.name}</span>
                <span class="item-count">{mod.items.length} {mod.items.length === 1 ? "item" : "items"}</span>
            </button>
            {#if expanded.has(mod.id)}
                <div class="module-items">
                    {#each mod.items.toSorted((a, b) => a.position - b.position) as item (item.id)}
                        {@const Icon = icons[item.type as keyof typeof icons] ?? BookOpen}
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
                                <span class="item-icon" title={item.type}><Icon /></span>
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
                                <span class="item-title">{item.title}</span>
                                {#if item.completion_requirement?.completed}<Check class="-success" />{/if}
                            </div>
                        {/if}
                    {/each}
                </div>
            {/if}
        </section>
    {/each}
</div>

<style lang="scss">
.module-list {
    gap: 1rem;
    /* allow some overscroll */
    padding-bottom: 16rem;
}

.module {
    overflow: hidden;

    .module-header {
        border: none;
        gap: 0.5rem;
        
        width: 100%;
        align-items: center;
        border-radius: 0;
        text-align: left;
        
        cursor: pointer;
        font-weight: bold;
    
        .module-name {
            flex: 1;
        }
        .item-count {
            color: var(--text-muted);
            font-size: var(--font-xs);
            font-weight: normal;
        }
    }
    
    .module-items {
        padding-top: 0.25rem;
    }
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

        .item-icon {
            line-height: 1;
            padding-top: 0.1rem;
            
            :global(svg) {
                width: 1rem;
                height: 1rem;
            }
        }

        .item-title {
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }
    }
}
</style>