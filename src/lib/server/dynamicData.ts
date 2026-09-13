import { readFile, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory, StoredData } from "./data";

// TODO: cron refresh for dynamic data sources so they predictable fetch data

/** the stored data in a cache file for a dynamic data source */
type StoredValue<T> = {
	value: T;
	fetchedAt: number;
	expiresAt: number;
};

/** the type sent to the client when loading dynamic data in a sveltekit ssr load function */
export type SKLoadDynamicData<T> = { cached: StoredValue<T> | undefined; updated: Promise<RefreshResult<T>> };

/** options for creating a new dynamic data source */
export type DynamicDataOptions<T> = {
	/** a stable name used as the filename */
	key: string;
	fetch: () => Promise<T>;
	/** how long a successfully fetched value is usable, in milliseconds */
	ttlMs: number;
	/** how long to wait before refetching the data, in milliseconds */
	refreshThresholdMs: number;
	/** refresh in the background on this interval, if present */
	refreshIntervalMs?: number;
	/** runs after a new value has been written; errors are logged and ignored */
	onUpdated?: (value: T, previous: T | undefined) => Promise<void> | void;
	/** optional comparison function for sending updated data to clients. falls back to json stringification if not provided */
	equals?: (a: T, b: T) => boolean;
	/**
	 * whether we require data to be fetched on the first load before returning or if we should return a "cached" null.
	 * defaults to false.
	 */
	requireInitialFetch?: boolean;
};

/** the result of a refresh operation */
export type RefreshResult<T> = { kind: "updated"; value: T } | { kind: "unchanged" };

/** lazily creates and retains one dynamic data source per key */
export class DynamicDataRegistry<Key, Value> {
	private readonly sources = new Map<Key, DynamicData<Value>>();

	constructor(private readonly create: (key: Key) => DynamicData<Value>) {}

	get(key: Key): DynamicData<Value> {
		let source = this.sources.get(key);
		if(!source) {
			source = this.create(key);
			this.sources.set(key, source);
		}
		return source;
	}

	destroy(): void {
		for(const source of this.sources.values()) source.destroy();
		this.sources.clear();
	}
}

/** sanitize a key for use as a path in the cache directory */
function safeKey(key: string): string {
	const parts = key.split("/").map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "_"));
	if(!key || parts.some((part) => !part || part === "." || part === ".."))
		throw new Error("dynamic data keys can't contain empty or traversal path segments");
	return parts.join("/");
}

/** check if a value is a valid StoredValue. lies a bit about T. */
function isStoredValue<T>(value: unknown): value is StoredValue<T> {
	if(typeof value !== "object" || value === null) return false;
	const record = value as Record<string, unknown>;
	return "value" in record && typeof record.fetchedAt === "number" && typeof record.expiresAt === "number";
}

/**
 * a small store for server-side data that caches, stores, and asynchronously refreshes data  
 * safe to use from SvelteKit load functions (obviously).  
 *   
 * the intended use is to send a cached value from `.get()`, then stream a refreshed value from `.refresh()` to the client.  
 * `.load()` is a wrapper that works with `dynamicDataState` on the client to make this pattern easier.
 * ```ts
 * export const load: PageServerLoad = async () => {
 *     return {
 *         // sends cached data immediately then streams updated data after the initial response
 *         value: dynamicData.load()
 *     };
 * };
 * ```
 */
export class DynamicData<T> extends StoredData<StoredValue<T>> {
    /** to disallow multiple simultaneous refreshes */
	private refreshPromise: Promise<RefreshResult<T>> | undefined;
    /** for refreshing */
	private timer: ReturnType<typeof setInterval> | undefined;

	constructor(private readonly options: DynamicDataOptions<T>) {
		if(!Number.isFinite(options.ttlMs) || options.ttlMs <= 0)
			throw new Error(`Invalid ttlMs for dynamic data '${options.key}'`);
		
		super(join("cache", `${safeKey(options.key)}.json`), isStoredValue<T>);

        // set up an interval to refresh the data in the background if necessary
		if(options.refreshIntervalMs !== undefined) {
			if(!Number.isFinite(options.refreshIntervalMs) || options.refreshIntervalMs <= 0) {
				throw new Error(`Invalid refreshIntervalMs for dynamic data '${options.key}'`);
			}
			this.timer = setInterval(() => {
				this.refresh().catch((error) => console.error(`Failed to refresh ${options.key}`, error));
			}, options.refreshIntervalMs);
			this.timer.unref?.();
		}
	}

	/** return the current non-expired value without fetching new data */
	async get(): Promise<StoredValue<T> | undefined> {
		const stored = await this.read();
		if(!stored) return undefined;
		if(stored.expiresAt <= Date.now()) {
			await this.delete();
			return undefined;
		}
		return stored;
	}

	/** fetch and return a new value. concurrent calls are safe. */
	async refresh(): Promise<RefreshResult<T>> {
        // if already refreshing, use the same promise
		if(this.refreshPromise) return this.refreshPromise;

		this.refreshPromise = (async () => {
			const previous = await this.get();

			if(previous && previous.fetchedAt > Date.now() - this.options.refreshThresholdMs) {
				return { kind: "unchanged" as const };
			}

			const value = await this.options.fetch();
			const stored: StoredValue<T> = {
				value,
				fetchedAt: Date.now(),
				expiresAt: Date.now() + this.options.ttlMs
			};

			await this.write(stored);
            
            const jsonCompare = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
			const changed = previous === undefined || !(this.options.equals ?? jsonCompare)(previous.value, value);

			if(changed && this.options.onUpdated) {
				try {
					await this.options.onUpdated(value, previous?.value);
				} catch(error) {
					console.error(`onUpdated failed for ${this.options.key}`, error);
				}
			}

			return changed ? { kind: "updated" as const, value } : { kind: "unchanged" as const };
		})().finally(() => { // crazy syntax but ok
			this.refreshPromise = undefined;
		});

		return this.refreshPromise;
	}

	/**
     * get cached data immediately and refresh it in the background.  
     * this is just slightly nicer wrapper for running `get()` and `refresh()` and sending the changes
     * to the client.
     */
	async load(
        transform: (v: T) => T = (cached) => cached
    ): Promise<SKLoadDynamicData<T>> {
        const rawCached = await this.get();
        const cached = rawCached ? { ...rawCached, value: transform(rawCached.value) } : undefined;
        const refreshPromise = this.refresh();
		const refreshTransform = refreshPromise.then((result) => result.kind === "updated" ?
			{ kind: "updated" as const, value: transform(result.value) } : result);

        // if not cached yet, wait for the refresh before returning any data
        if(!cached) {
			if(!this.options.requireInitialFetch) {
				return {
					cached: undefined,
					updated: refreshTransform
				};
			}

            const result = await refreshTransform;
            if(result.kind !== "updated") {
                // this should never happen: if there was no cached value, refreshing _should_ produce a new one.
                // i guess there are some edge cases like the fetch returning undefined or failing, but we probably
                // don't care about the value in those cases, so... just fail
                throw new Error(`Dynamic data '${this.options.key}' refresh didn't produce a new value`);
            }
            return {
                cached: {
                    value: result.value,
                    fetchedAt: Date.now(),
                    expiresAt: Date.now() + this.options.ttlMs
                },
                updated: Promise.resolve({ kind: "unchanged" as const })
            };
        }

        return {
            cached,
            // sveltekit streams this promise after the initial response
            updated: refreshTransform
        };
	}

    /** clean up if being destroyed. necessary for data sources with a refresh interval. */
	destroy(): void {
		if(this.timer) clearInterval(this.timer);
	}
}

async function findDynamicDataFiles(directory: string): Promise<string[]> {
	let entries;
	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch(error) {
		if((error as NodeJS.ErrnoException).code === "ENOENT") return [];
		throw error;
	}

	const files: string[] = [];
	for(const entry of entries) {
		const path = join(directory, entry.name);
		if(entry.isDirectory()) files.push(...await findDynamicDataFiles(path));
		else if(entry.isFile() && entry.name.endsWith(".json")) files.push(path);
	}
	return files;
}

/** remove expired dynamic data cache entries */
export async function garbageCollectDynamicData(): Promise<number> {
	const files = await findDynamicDataFiles(join(dataDirectory, "cache"));
	let removed = 0;
	for(const path of files) {
		try {
			const value = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
			if(typeof value.expiresAt === "number" && value.expiresAt <= Date.now()) {
				await unlink(path);
				removed += 1;
			}
		} catch(error) {
			console.warn(`Unable to inspect dynamic-data cache ${path}`, error);
		}
	}
	return removed;
}

garbageCollectDynamicData().catch((error) => console.error("Failed to gc dynamic data", error));
setInterval(() => {
	garbageCollectDynamicData().catch((error) => console.error("Failed to gc dynamic data", error));
}, 1000 * 60 * 60 * 24); // gc every 24 hours