<script lang="ts">
	import { page } from "$app/state";
	import { dynamicDataState } from "$lib/dynamicData.svelte";
	import { BookOpen, Check, ChevronDown, ChevronRight, CircleQuestionMark, ClipboardList, ExternalLink, FileText, MessageSquare, Paperclip, Pencil } from "@lucide/svelte";
	import type { CanvasModuleItem } from "$lib/server/canvas/modules";
	import type { CanvasModuleItemType } from "$lib/server/canvas/modules";
	import type { PageData } from "./$types";
    import { pageData } from "../../../../+layout.svelte";
    import { getGlobalCourse } from "../+layout.svelte";

	let { data }: { data: PageData } = $props();
	
    const modules = dynamicDataState(() => data.modules);

    const globalCourse = getGlobalCourse();
    const course = $derived(globalCourse.value?.course);
    pageData(() => ({
        title: `${course?.displayedName ?? course?.fullName ?? "Unknown course"} - Modules`,
        canvasUrl: `${data.settings.canvasHostname}/courses/${page.params.courseId}/modules`
    }));
	
    // TODO: persist collapsed state, ideally on the server but maybe just in local storage
    let expanded = $state(new Set<number>(modules.value?.modules.map(m => m.id) ?? []));
	function toggle(moduleId: number): void {
		const next = new Set(expanded);
		if(next.has(moduleId)) next.delete(moduleId);
		else next.add(moduleId);
		expanded = next;
	}
    
	function itemHref(item: CanvasModuleItem): string | undefined {
		if(item.type === "Page" && item.page_url) return `/course/${page.params.courseId}/pages/${item.page_url}`;
		if(item.type === "Assignment" && item.content_id) return `/course/${page.params.courseId}/assignments/${item.content_id}`;
		return item.external_url ?? item.url;
	}

	function itemIsExternal(item: CanvasModuleItem): boolean {
		return Boolean(item.external_url) || item.type === "ExternalUrl" || item.type === "File";
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

<div class="modules-page">
	<header class="page-header -hflex">
		<h1>Modules</h1>
		{#if modules.value}<span class="count">({modules.value.modules.length})</span>{/if}
	</header>

	{#if modules.value?.modules.length}
		<div class="module-list -vflex">
			{#each modules.value.modules as mod (mod.id)}
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
								<a
                                    class="module-item -hflex -input -flat"
                                    style={`--indent: ${item.indent ?? 0}`}
                                    
                                    href={href}
                                    data-type={item.type}
                                    target={itemIsExternal(item) ? "_blank" : undefined}
                                    rel={itemIsExternal(item) ? "noreferrer" : undefined}
                                >
									<span class="item-icon"><Icon /></span>
									{#if href}
                                        <span class="item-title">{item.title}</span>
									{:else}
										<span class="item-title">{item.title}</span>
									{/if}
									{#if item.completion_requirement?.completed}<Check class="-success" />{/if}
                                </a>
							{/each}
						</div>
					{/if}
				</section>
			{/each}
		</div>
	{:else if modules.value}
		<p class="-empty">No modules found.</p>
	{:else}
		<p class="-empty">Loading modules...</p>
	{/if}
	{#if modules.error}<p class="-empty">Error loading modules: {modules.error}</p>{/if}
</div>

<style lang="scss">
.modules-page {
	max-width: 100ch;
	margin: 0 auto;
}

.page-header {
	align-items: baseline;
	gap: 0.5rem;
	margin-bottom: 1rem;
	
    .count {
        color: var(--text-muted);
        font-size: var(--font-md);
    }
}

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
