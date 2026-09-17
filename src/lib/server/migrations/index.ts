import fs from "fs/promises";

import type { Migration } from "./migration";
import { dataDirectory } from "../data";

import { MultiInstanceMigration } from "./multiInstance";

type MigrationData = {
    applied: string[];
};
const MIGRATION_FILE = "migrations.json";

const migrations: Migration[] = [
    new MultiInstanceMigration()
];

export async function applyNewMigrations(): Promise<void> {
    const migrationFilePath = `${dataDirectory}/${MIGRATION_FILE}`;

    let migrationData: MigrationData = { applied: [] };
    try {
        const contents = await fs.readFile(migrationFilePath, "utf8");
        migrationData = JSON.parse(contents) as MigrationData;
    } catch(error) {
        if((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }

    let applied = 0;
    for(const migration of migrations) {
        if(!migrationData.applied.includes(migration.getName())) {
            try {
                await migration.up();
                migrationData.applied.push(migration.getName());
                applied++;
            } catch(error) {
                console.error(`Error applying migration ${migration.getName()}:`, error);
                throw error;
            }
        }
    }

    console.log(`Applied ${applied} new migration(s).`);

    await fs.writeFile(migrationFilePath, JSON.stringify(migrationData, null, 2), "utf8");
}