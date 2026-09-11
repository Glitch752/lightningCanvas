# LightningCanvas
_because lightning means quick, right?_  
  
  
A work-in-progress single-user-focused [Canvas LMS](https://canvas.instructure.com/) frontend using API tokens optimized for one thing: speed.

On slow computers and networks, I've always been fed up with how long Canvas takes to load. This project makes the frontend as fast as possible by caching client-side, proactively polling slow API endpoints, using fast SvelteKit SSR with preload and whatever else, and removing all the unnecessary bloat.

Secondary goals are customizability, better use of space than the official Canvas frontend, better views for things like tasks and grades, and acting as a webhook client to push calendar/task data to other apps.

Doesn't replicate the entire (or even a large fraction of) Canvas functionality, but provides a faster route for common things like opening assignments, checking grades, and viewing tasks. Things like submission, discussions, users, and other things still just redirect to the official Canvas frontend.

## Development notes
- We use [Lucide icons](https://lucide.dev/) for icons, but Vite tree-shaking the whole "export barrel"(?) under the root is _very_ slow and messes with the TS server. Instead, make _should_ import individual icons like `import Check from "@lucide/svelte/icons/check"`. The TS server doesn't do this itself, though, so... I just occasionally go through and fix it. Maybe we should look into a vite plugin or something to do this.
- We put `lang="scss"` on the `<style>` tag in Svelte files, but we don't actually use any SCSS features or a preprocessor. It fixes VSCode's syntax highlighting for CSS nesting...
- Conventions: 4 indents, double quotes, semicolons, no space before for/if/while parentheses
- 