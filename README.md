# LightningCanvas
_because lightning means quick, right?_  
  
  
A work-in-progress single-user-focused [Canvas LMS](https://canvas.instructure.com/) frontend using API tokens optimized for one thing: speed.

On slow computers and networks, I've always been fed up with how long Canvas takes to load. This project aims to make the fastest Canvas frontend possible by caching client-side, proactively polling slow API endpoints, reducing unnecessary network requests, using fast SvelteKit SSR with page preloading, replacing slow embeds (*cough* youtube), and removing all the unnecessary bloat.

Secondary goals are linking multiple canvas instances under a single interface, customizability, better use of space than the official Canvas frontend, better views for things like tasks and grades, and acting as a webhook server to bidirectionally sync calendar/task data to other apps.

This doesn't replicate the entire (or even a large fraction of) Canvas functionality, but provides a faster route for common things like opening assignments, checking grades, and viewing tasks. Things like submission, discussions, users, and more still just redirect to the official Canvas frontend.

## Roadmap
- [x] courses page
- [x] todo list with canvas planner override sync
- [x] render course home page
- [x] course modules page
- [x] cache GC
- [x] course pages... page and rendering
- [x] course assignment pages and rendering
- [x] course grades page
- [x] link multiple Canvas accounts/campus instances
- [x] assignments page
- [x] pages... page
- [ ] announcements page and home screen preview
- [ ] course assignment submission for certain simple types (text entry and url maybe)
- [ ] calendar page
- [ ] external calendar/tasks sync
- [ ] starring/pinning modules, assignments, and pages
- [ ] module file preview/download (/courses/files/...)
- [ ] host and optimize images and other media
- [ ] show when page comes from cached serviceworker

- [ ] better course art, maybe procedurally generated pixel art? (ooh)
- [ ] allow adding custom course-like items on the dashboard for courses that don't exist in Canvas
- [ ] visual customization options like themes
- [ ] pin items (assignments, pages, modules, whatever) to nav and homepage
- [ ] simple multi-user support (without signup or anything) and shared course caching

## Development notes
- We use [Lucide icons](https://lucide.dev/) for icons, but Vite tree-shaking the whole "export barrel"(?) under the root is _very_ slow and messes with the TS server. Instead, we _should_ import individual icons like `import Check from "@lucide/svelte/icons/check"`. The TS server doesn't do this itself, though, so... I just occasionally go through and fix it with `pnpm run fix-lucide`.
- We put `lang="scss"` on the `<style>` tag in Svelte files, but we don't actually use any SCSS features or a preprocessor. It fixes VSCode's syntax highlighting for CSS nesting...
- There's a .prettierrc in the root, but I don't actually use Prettier... it's to fix the Svelte VSCode extension's automatic indent in a few places.
- Conventions: 4 indents, double quotes, semicolons, no space before for/if/while parentheses