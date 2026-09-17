import { writable, type Writable } from "svelte/store";
type PageData = {
    title: string;
    canvasUrl: string | null;
};
export const pageDataStore: Writable<PageData> = writable({
    title: "Loading...",
    canvasUrl: null
});

/** Automatically set the page data for this page */
export function pageData(data: () => PageData) {
    $effect(() => {
        pageDataStore.set(data());
    });
}