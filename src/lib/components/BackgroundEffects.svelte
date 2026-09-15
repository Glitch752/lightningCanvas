<!--
    Subtle background effects run in a canvas, made to be as lightweight as possible:
    - a single canvas element
    - 15fps animation if the tab is visible, otherwise no animation
    - low resolution (pixel art - it's an ""intentional aesthetic"")
    - pretty lightweight drawing loop

    Right now, we only have one effect: rain! it's simple falling streaks of raindrops, meant
    to mimic pixel art rain animations the best i can. drops have a little splash on the bottom
    and can collide with the cursor. no particles involved
-->

<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let animationFrameId: number | null = null;

    const horizontalResolution = 240;
    const animationFramerate = 15;
    const dropCount = 70;
    const fadeInDuration = 1200;

    type RainDrop = {
        x: number; y: number; yRemainder: number;
        length: number; speed: number;
        opacity: number;
        splash: number; splashX: number; splashY: number;
    };

    let drops: RainDrop[] = [];
    let effectOpacity = 0;
    let fadeInElapsed = 0;

    let mouseX = -1000;
    let mouseY = -1000;
    function updateMousePosition(event: MouseEvent) {
        if(!canvas) return;
        const bounds = canvas.getBoundingClientRect();
        mouseX = (event.clientX - bounds.left) * canvas.width / bounds.width;
        mouseY = (event.clientY - bounds.top) * canvas.height / bounds.height;
    }

    const maximumSlope = 0.3;
    const rainDirectionY = 1;
    const mouseSplashRadius = 15;

    let windTime = Math.random() * Math.PI * 2;
    let pixelSlope = Number.NaN;

    function randomDrop(): RainDrop {
        const depth = 0.25 + Math.random() * 0.75;
        return {
            // x is the line's intercept at the top of the canvas, and needs to be sometimes negative to
            // allow drops entering from the left
            x: Math.round(Math.random() * (horizontalResolution + maximumSlope * (canvas?.height ?? 100)) - maximumSlope * (canvas?.height ?? 100)),
            y: Math.round(Math.random() * ((canvas?.height ?? 100) + 100) - 50),
            yRemainder: 0,
            // longer, faster, and subtler streaks for distance
            length: Math.round(20 + depth * 40),
            speed: 100 + depth * 300,
            opacity: 0.002 + depth * 0.015,
            splash: 0, splashX: 0, splashY: 0
        };
    }

    function resetDrop(drop: RainDrop) {
        drop.x = Math.round(Math.random() * (horizontalResolution + maximumSlope * canvas.height) - maximumSlope * canvas.height);
        drop.y = -drop.length * rainDirectionY - 1;
        drop.yRemainder = 0;
        drop.splash = 0;
    }

    function resize() {
        if(!canvas) return;

        // set fixed positioning to match the parent's bounds
        const parent = canvas.parentElement;
        if(!parent) return;
        
        const bounds = parent.getBoundingClientRect();
        canvas.style.top = `${bounds.top}px`;
        canvas.style.left = `${bounds.left}px`;
        canvas.style.width = `${bounds.width}px`;
        canvas.style.height = `${bounds.height}px`;

        // set the canvas resolution to match the aspect ratio of the parent,
        // but with a fixed horizontal resolution
        const aspectRatio = canvas.clientWidth / canvas.clientHeight;
        canvas.width = horizontalResolution;
        canvas.height = Math.floor(horizontalResolution / aspectRatio);
    }

    function draw(deltaTime: number) {
        if(!canvas || !ctx) return;

        // clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.lineWidth = 1;

        const elapsed = Math.min(deltaTime, 100) / 1000;
        fadeInElapsed = Math.min(fadeInDuration, fadeInElapsed + deltaTime);
        effectOpacity = fadeInElapsed / fadeInDuration;
        windTime += elapsed;
        const slope = maximumSlope * (0.5 + Math.sin(windTime * 0.08) * 0.5);
        pixelSlope = slope;

        for(const drop of drops) {
            // update the drop's position and splash
            drop.yRemainder += drop.speed * elapsed;
            const distance = Math.trunc(drop.yRemainder);
            drop.yRemainder -= distance;
            drop.y += distance;

            if(drop.splash > 0) {
                drop.splash = Math.max(0, drop.splash - elapsed * 5);
                if(drop.splash === 0) resetDrop(drop);
            }

            // if the mouse is over the drop, splash at the mouse position.
            // otherwise, splash at the bottom of the canvas
            const firstY = Math.max(0, drop.y - drop.length);
            const lastY = Math.min(canvas.height - 1, drop.y);
            const mouseLineX = drop.x + Math.round(slope * mouseY);
            const mouseOverDrop = mouseY >= firstY && mouseY <= lastY && Math.abs(mouseLineX - mouseX) <= mouseSplashRadius;

            if(drop.splash === 0 && (drop.y - drop.length >= canvas.height || mouseOverDrop)) {
                drop.splash = 1;
                drop.splashX = Math.round(mouseOverDrop ?
                    // this average is silly and nonsensical but it looks nicer
                    (mouseX + mouseLineX) / 2 :
                    drop.x + slope * (canvas.height - 1)
                );
                drop.splashY = mouseOverDrop ? Math.round(mouseY) : canvas.height - 1;
            }

            // draw the drop's streak
            if(drop.splash === 0) {
                ctx.fillStyle = `rgba(150, 205, 255, ${drop.opacity * effectOpacity})`;
                // streak pos is just the vertical window. this means they get longer with angle, but oh well
                for(let pixelY = firstY; pixelY <= lastY; pixelY++) {
                    const pixelX = drop.x + Math.round(pixelSlope * pixelY);
                    ctx.fillRect(pixelX, pixelY, 1, 1);
                }
            }

            // draw the drop's splash
            if(drop.splash > 0) {
                const progress = 1 - drop.splash;
                const width = Math.round(2 + progress * 4);
                const height = Math.max(1, Math.round(progress * 3));
                const alpha = drop.opacity * drop.splash * effectOpacity * 4;

                // kind of silly but it looks okay
                ctx.fillStyle = `rgba(170, 220, 255, ${alpha})`;
                ctx.fillRect(Math.round(drop.splashX - width), Math.round(drop.splashY), width * 2 + 1, 1);
                ctx.fillRect(Math.round(drop.splashX - width + 1), Math.round(drop.splashY - height), 1, height);
                ctx.fillRect(Math.round(drop.splashX + width - 1), Math.round(drop.splashY - height), 1, height);
                ctx.fillRect(Math.round(drop.splashX), Math.round(drop.splashY - height - 1), 1, 1);
            }
        }
    }

    onMount(() => {
        if(!canvas) return;
        ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;

        window.addEventListener("mousemove", updateMousePosition);
        window.addEventListener("resize", resize);

        resize();

        drops = Array.from({ length: dropCount }, () => randomDrop());

        let lastTime = performance.now();
        function animate() {
            const now = performance.now();
            const deltaTime = now - lastTime;
            if(deltaTime >= 1000 / animationFramerate) {
                draw(deltaTime);
                lastTime = now;
            }

            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    });
    onDestroy(() => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", updateMousePosition);
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
    });
</script>

<canvas bind:this={canvas}></canvas>

<style lang="scss">
canvas {
    position: fixed;
    pointer-events: none;
    z-index: -100;

    /* pixel art aesthetic */
    image-rendering: pixelated;
}
</style>