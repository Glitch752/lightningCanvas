<!-- icons for any kind of course item, either module or planner right now -->

<script lang="ts">
    import type { CanvasPlannerItem } from "$lib/server/canvas/courses";
    import type { CanvasModuleItemType } from "$lib/server/canvas/modules";
    import BookOpen from "@lucide/svelte/icons/book-open";
    import CircleQuestionMark from "@lucide/svelte/icons/circle-question-mark";
    import ClipboardList from "@lucide/svelte/icons/clipboard-list";
    import ExternalLink from "@lucide/svelte/icons/external-link";
    import FileText from "@lucide/svelte/icons/file-text";
    import Megaphone from "@lucide/svelte/icons/megaphone";
    import MessageSquare from "@lucide/svelte/icons/message-square";
    import Paperclip from "@lucide/svelte/icons/paperclip";
    import Pencil from "@lucide/svelte/icons/pencil";

    let { type, title }: {
        type: CanvasModuleItemType | CanvasPlannerItem["plannableType"];
        title?: string
    } = $props();

    const icons: Record<typeof type, typeof BookOpen> = {
        File: Paperclip,
        Page: FileText,
        Discussion: MessageSquare,
        Assignment: ClipboardList,
        Quiz: CircleQuestionMark,
        ExternalUrl: ExternalLink,
        SubHeader: Pencil,

        assignment: ClipboardList,
        quiz: CircleQuestionMark,
        announcement: Megaphone
    };

    const Icon = $derived(icons[type] ?? BookOpen);
</script>

<span class="item-icon" title={title ?? type}><Icon /></span>

<style lang="scss">
.item-icon {
    line-height: 1;
    /* just visually centers it a little better */
    padding-top: 0.1rem;
    vertical-align: middle;

    :global(svg) {
        width: 1rem;
        height: 1rem;
    }
}
</style>
