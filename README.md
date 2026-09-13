# LightningCanvas
_because lightning means quick, right?_  
  
  
A work-in-progress single-user-focused [Canvas LMS](https://canvas.instructure.com/) frontend using API tokens optimized for one thing: speed.

On slow computers and networks, I've always been fed up with how long Canvas takes to load. This project aims to make the fastest Canvas frontend possible by caching client-side, proactively polling slow API endpoints, reducing unnecessary network requests, using fast SvelteKit SSR with page preloading, replacing slow embeds (*cough* youtube), and removing all the unnecessary bloat.

Secondary goals are customizability, better use of space than the official Canvas frontend, better views for things like tasks and grades, and acting as a webhook client to push calendar/task data to other apps.

Doesn't replicate the entire (or even a large fraction of) Canvas functionality, but provides a faster route for common things like opening assignments, checking grades, and viewing tasks. Things like submission, discussions, users, and other things still just redirect to the official Canvas frontend.

## Roadmap
- [x] courses page
- [x] todo list
- [x] render course home page
- [x] course modules page
- [x] cache GC
- [x] course pages... page and rendering
- [ ] course assignment pages and rendering
- [ ] course assignment submission for certain simple types (text entry and url maybe)
- [ ] course grades page
- [ ] calendar page
- [ ] external calendar sync

- [ ] link multiple Canvas accounts/campus instances
- [ ] allow adding custom course-like items on the dashboard for courses that don't exist in Canvas
- [ ] visual customization options like themes
- [ ] pin items (assignments, pages, modules, whatever) to nav and homepage
- [ ] simple multi-user support (without signup or anything) and shared course caching

## Development notes
- We use [Lucide icons](https://lucide.dev/) for icons, but Vite tree-shaking the whole "export barrel"(?) under the root is _very_ slow and messes with the TS server. Instead, make _should_ import individual icons like `import Check from "@lucide/svelte/icons/check"`. The TS server doesn't do this itself, though, so... I just occasionally go through and fix it. Maybe we should look into a vite plugin or something to do this.
- We put `lang="scss"` on the `<style>` tag in Svelte files, but we don't actually use any SCSS features or a preprocessor. It fixes VSCode's syntax highlighting for CSS nesting...
- Conventions: 4 indents, double quotes, semicolons, no space before for/if/while parentheses
- 