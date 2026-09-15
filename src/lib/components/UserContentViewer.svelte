<script lang="ts">
    import { colorString, contrastColor, contrastRatio, nearestBackground, parseColor } from "./contrastOptimization";

    const { title, body }: { title?: string, body?: string } = $props();

    /**
     * the raw HTML is rendered first, then we adjust it for visual consistency on the client
     * we could maybe transform on the server with a virtual dom library, but i tried and it
     * gets complicated with things like style-dependence
     */
    function enhanceUserContent(node: HTMLElement) {
        const defaultBackground = parseColor(getComputedStyle(node).backgroundColor) ?? [0, 0, 0];

        // canvas _can_ declare font[color]... :p
        for(const element of node.querySelectorAll<HTMLElement>("[style], font[color]")) {
            const foreground = element.style.color || element.getAttribute("color");
            if(!foreground) continue;

            const foregroundColor = parseColor(foreground);
            if(!foregroundColor) continue;

            const background = nearestBackground(element, defaultBackground);
            // this is a horrible approach, but i'm getting tired of messing with this :p
            const text = parseColor(getComputedStyle(document.documentElement).getPropertyValue("--text")) ?? [0, 0, 0];
            
            if(contrastRatio(foregroundColor, background) < 4.5) {
                const improved = contrastColor(foregroundColor, background, text, background);
                if (element.style.color) element.style.color = colorString(improved);
                else element.setAttribute("color", colorString(improved));
            }
        }
        
        // pass 2, personal preference: Canvas point sizes tend to feel larger here than they do in Canvas itself.
        // replace `font-size: xxpt` with a slightly smaller size to make it more readable.
        for(const element of node.querySelectorAll<HTMLElement>("[style]")) {
            if(element.style.fontSize) {
                element.style.fontSize = element.style.fontSize.replace(
                    /^(\d+(?:\.\d+)?)pt$/,
                    (_, size) => `${Math.round(Number(size) * 0.8 * 10) / 10}pt`
                );
            }
        }

        // pass 3: remove explicit width/height, either style or attribute, from tables. it just tends
        // to cause issues
        for(const element of node.querySelectorAll<HTMLTableElement>("table")) {
            if(element.style.width) element.style.width = "";
            if(element.style.height) element.style.height = "";
            if(element.hasAttribute("width")) element.removeAttribute("width");
            if(element.hasAttribute("height")) element.removeAttribute("height");
        }

        // pass 4: replace iframes with lighter versions where applicable.
        // for now, just youtube embeds, but we could add more in the future.
        // TODO: custom google slides embed with prerendered slides? not sure how feasible that is but
        // the default embed is sooo heavy
        let youtubeLoaded = false;
        for(const element of node.querySelectorAll<HTMLIFrameElement>("disabled-iframe")) {
            const src = element.getAttribute("src") ?? "";
            const youtube = youtubeVideo(src);
            if(youtube) {
                const lite = document.createElement("lite-youtube");
                lite.setAttribute("videoid", youtube.id);
                if(youtube.params) lite.setAttribute("params", youtube.params);
                
                const wrapper = document.createElement("div");
                wrapper.classList.add("lite-youtube-wrapper");
                wrapper.appendChild(lite);
                element.replaceWith(wrapper);

                youtubeLoaded = true;
            } else {
                // replace with a full iframe with the same attributes
                const iframe = document.createElement("iframe");
                for(const attr of element.attributes) {
                    iframe.setAttribute(attr.name, attr.value);
                }
                element.replaceWith(iframe);
            }
        }

        if(youtubeLoaded) {
            // load lite-youtube lazily if we replaced any youtube embeds
            import("@justinribeiro/lite-youtube");
        }
    }

    type YouTubeVideo = { id: string; params: string };

    function youtubeVideo(source: string): YouTubeVideo | undefined {
        let url: URL;
        try { url = new URL(source); }
        catch { return undefined; }

        const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
        let id: string | undefined;
        if(hostname === "youtu.be") id = url.pathname.slice(1).split("/")[0];
        else if(hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
            if(url.pathname === "/watch") id = url.searchParams.get("v") ?? undefined;
            else if(url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
            else if(url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2];
        }
        if(!id) return undefined;

        const params = new URLSearchParams(url.search);
        params.delete("v");
        return { id, params: params.toString() };
    }

    // we _do_ do a few light server transformations to the html before ever rendering:
    // disable iframes until we can replace them with lighter embeds or re-enable them
    function lightServerTransform(html: string): string {
        // disable iframes by replacing their elemnt with <disabled-iframe>
        // this isn't perfect at all, but close enough for what canvas gives us in almost any circumstance
        return html.replace(/<iframe\b/gi, "<disabled-iframe").replace(/<\/iframe>/gi, "</disabled-iframe>");
    }
</script>

<article use:enhanceUserContent class="user-content -vflex">
    {#if title}
        <h1 class="course-content-header">{title}</h1>
    {/if}
    
    {#if body}
        {@html lightServerTransform(body)}
    {:else}
        <p class="-empty">This page does not have any content.</p>
    {/if}
</article>

<style lang="scss">
.user-content {
    padding: 1rem;
    
    gap: 0.5rem;
    min-width: 0;
    justify-self: center;
    max-width: 120ch;
    width: 100%;
    overflow: hidden;

    word-break: break-word;

    .course-content-header {
        margin-bottom: 3rem;
    }

    :global(img) {
        max-width: 100%;
        height: auto;
        border-radius: var(--radius);
    }
    :global(iframe) {
        max-width: 100%;
        border: none;
        border-radius: var(--radius);
        /* of course doesn't apply to every type of content but tends to look best imo */
        aspect-ratio: 16/10;
        height: auto !important;
    }

    :global(.lite-youtube-wrapper) {
        display: block;
        width: 100%;
    }
    :global(lite-youtube) {
        border-radius: var(--radius);
        aspect-ratio: 16/9;
    }

    :global(table) {
        max-width: 100%;
        overflow: auto;
        display: block;
        overflow: visible;
        
        /* some courses have reeeeally weird table layouts and this makes them at least slightly readable */
        &:not([cellspacing]) {
            border-spacing: 1rem;
        }
    }
    :global(tbody), :global(thead), :global(tfoot) {
        width: 100%;
        /* feels weird but it works */
        display: table;
    }

    :global(p) {
        margin: 0.5rem 0;
    }

    :global(.screenreader-only) {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
}
</style>