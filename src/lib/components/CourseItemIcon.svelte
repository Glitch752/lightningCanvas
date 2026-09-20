<script lang="ts">
    import BookOpen from "@lucide/svelte/icons/book-open";
    import CircleQuestionMark from "@lucide/svelte/icons/circle-question-mark";
    import ClipboardList from "@lucide/svelte/icons/clipboard-list";
    import ExternalLink from "@lucide/svelte/icons/external-link";
    import FileText from "@lucide/svelte/icons/file-text";
    import MessageSquare from "@lucide/svelte/icons/message-square";
    import Paperclip from "@lucide/svelte/icons/paperclip";
    import Pencil from "@lucide/svelte/icons/pencil";

    let { type, title }: { type: string; title?: string } = $props();

    const icons: Record<string, typeof BookOpen> = {
        File: Paperclip,
        Page: FileText,
        Discussion: MessageSquare,
        Assignment: ClipboardList,
        Quiz: CircleQuestionMark,
        ExternalUrl: ExternalLink,
        SubHeader: Pencil
    };

    const Icon = $derived(icons[type] ?? BookOpen);
</script>

<span class="item-icon" title={title ?? type}><Icon /></span>

<style lang="scss">
.item-icon {
    line-height: 1;
    padding-top: 0.1rem;

    :global(svg) {
        width: 1rem;
        height: 1rem;
    }
}
</style>
