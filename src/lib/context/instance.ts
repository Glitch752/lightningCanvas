import { createContext } from "svelte";
import type { CanvasInstance } from "$lib/settings";

export type InstanceContext = {
    instance: CanvasInstance;
};
export const [getInstanceContext, setInstanceContext] = createContext<InstanceContext>();