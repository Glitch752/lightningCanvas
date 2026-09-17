import { env } from "$env/dynamic/private";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const dataDirectory = env.DATA_PATH || join(process.cwd(), "data");

/** a small wrapper for storing data on the server */
export class StoredData<T> {
    /** the full path to the stored file */
	private readonly path: string;
    /** in-memory cache; undefined if not loaded, null if loaded but not found, or the value if loaded */
	private memory: T | null | undefined;

    /**
     * @param path relative path inside the data directory to store the data in
     * @param validate a function to validate the data before storing it
     */
    constructor(path: string, private readonly validate: (value: unknown) => value is T) {
        this.path = join(dataDirectory, path);
    }

    /** delete the stored data */
    protected async delete() {
        this.memory = null;
        await rm(this.path, { force: true });
    }


    /** read the cached data from disk or memory */
	protected async read(): Promise<T | undefined> {
		if(this.memory !== undefined) return this.memory || undefined;

		try {
			const parsed: unknown = JSON.parse(await readFile(this.path, "utf8"));
			if(!this.validate(parsed)) {
				this.memory = null;
				return undefined;
			}
			this.memory = parsed as T;
			return this.memory;
		} catch(error) {
			if((error as NodeJS.ErrnoException).code === "ENOENT") {
				this.memory = null;
				return undefined;
			}
			throw error;
		}
	}

    /** write the cached data to disk */
	protected async write(value: T): Promise<void> {
		await mkdir(dirname(this.path), { recursive: true });
        // atomically write, probably not necessary but just in case
		const temporaryPath = `${this.path}.${process.pid}.tmp`;
		await writeFile(temporaryPath, `${JSON.stringify(value)}\n`, "utf8");
		await rename(temporaryPath, this.path);
		this.memory = value;
	}
}

/** options for creating an ImmutableFetchedData instance */
type ImmutableFetchedDataOptions<T, Key> = {
    path: string;

    /** a function to fetch the data, or null if unavailable (in which case we'll try again next update) */
    fetch: (key: Key) => Promise<T> | null;
    /** a function to get the current key */
    key: () => Promise<Key>;

	/** optional key comparison function for change tracking. falls back to json stringification if not provided */
	equals?: (a: Key, b: Key) => boolean;
};

/**
 * a stored data class to fetch data and save it, only removing the stored data if a key changes.  
 * used for data tied to other information like user ids (to tokens).
 */
export class ImmutableFetchedData<T, Key> extends StoredData<{ value: T, key: Key }> {
    private updating: Promise<T | null> | null = null;

    constructor(private readonly options: ImmutableFetchedDataOptions<T, Key>) {
        super(options.path, (value: unknown): value is { value: T, key: Key } => {
            if(typeof value !== "object" || value === null) return false;
            const record = value as Record<string, unknown>;
            return "value" in record && "key" in record;
        });
    }

    /** re-fetch if the key has changed, returning the value at the end. */
    public async update(): Promise<T | null> {
        if(this.updating) {
            return await this.updating;
        }

        this.updating = new Promise<T | null>(async (resolve) => {
            const currentKey = await this.options.key();
            const stored = await this.read();

            const jsonCompare = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
            if(stored && (this.options.equals ?? jsonCompare)(stored.key, currentKey)) {
                resolve(stored.value);
                return;
            }

            const fetched = await this.options.fetch(currentKey)
                ?.catch((error) => {
                    console.error(`Failed to fetch data for key ${currentKey}`, error);
                    return null;
                });
            if(!fetched) {
                resolve(null);
                return;
            }

            await this.write({ value: fetched, key: currentKey });
            resolve(fetched);
        }).finally(() => {
            this.updating = null;
        });

        return await this.updating;
    }

    /** get the current value, fetching it if necessary */
    public async get(): Promise<T | null> {
        try {
            return await this.update();
        } catch (error) {
            console.error(`Failed to get data for immutable data key ${await this.options.key()}`, error);
            return null;
        }
    }
}