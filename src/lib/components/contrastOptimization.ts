export type Color = [number, number, number];

export function nearestBackground(element: HTMLElement, fallback: Color): Color {
    let current: HTMLElement | null = element;
    while(current) {
        const style = getComputedStyle(current);
        const background = parseColor(style.backgroundColor);
        if(background && style.backgroundColor !== "rgba(0, 0, 0, 0)") return background;
        current = current.parentElement;
    }
    return fallback;
}

export function parseColor(value: string): Color | undefined {
    // we could probably do this with the dom somehow, but whatever

    const normalized = value.trim().toLowerCase();
    const hex = normalized.match(/^#([\da-f]{3,8})$/i)?.[1];
    if(hex) {
        const expanded = hex.length <= 4 ? hex.split("").map((part) => part + part).join("") : hex;
        if(expanded.length < 6) return undefined;
        return [
            parseInt(expanded.slice(0, 2), 16),
            parseInt(expanded.slice(2, 4), 16),
            parseInt(expanded.slice(4, 6), 16)
        ];
    }

    const rgb = normalized.match(/^rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)/);
    if(rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];

    const named: Record<string, Color> = {
        black: [0, 0, 0], white: [255, 255, 255], red: [255, 0, 0],
        green: [0, 128, 0], blue: [0, 0, 255], yellow: [255, 255, 0],
        gray: [128, 128, 128], grey: [128, 128, 128]
    };
    return named[normalized];
}

export function luminance([red, green, blue]: Color): number {
    const linear = (channel: number) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return linear(red) * 0.2126 + linear(green) * 0.7152 + linear(blue) * 0.0722;
}

export function contrastRatio(first: Color, second: Color): number {
    const lighter = Math.max(luminance(first), luminance(second));
    const darker = Math.min(luminance(first), luminance(second));
    return (lighter + 0.05) / (darker + 0.05);
}

export function contrastColor(foreground: Color, background: Color, light: Color, dark: Color): Color {
    const lightRatio = contrastRatio(light, background);
    const darkRatio = contrastRatio(dark, background);
    if(Math.max(lightRatio, darkRatio) >= 4.5) {
        // keep the original color when possible, but use a readable when not
        return lightRatio >= darkRatio ? light : dark;
    }
    return luminance(foreground) > luminance(background) ? light : dark;
}

export function colorString([red, green, blue]: Color): string {
    return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
}