<!-- a wrapper for UserContentInner that handles errors -->

<script lang="ts">
    import type { ComponentProps } from "svelte";
    import ErrorBoundary from "./ErrorBoundary.svelte";
    import UserContentInner from "./UserContentInner.svelte";

    const props: ComponentProps<typeof UserContentInner> = $props();
</script>

<ErrorBoundary type="user content">
    <UserContentInner {...props} />
</ErrorBoundary>