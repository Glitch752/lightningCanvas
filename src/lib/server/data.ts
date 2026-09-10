import { env } from "$env/dynamic/private";
import { join } from "node:path";

export const dataDirectory = env.DATA_PATH || join(process.cwd(), "data");
