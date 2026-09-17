import { Migration } from "./migration";
import fs from "fs/promises";

export class MultiInstanceMigration extends Migration {
    async up(): Promise<void> {
        const settingsContent = await fs.readFile(`${this.dataDirectory}/settings.json`, "utf8");
        const settings = JSON.parse(settingsContent);

        const { canvasHostname, canvasApiKey } = settings;
        const newSettings = {
            canvasInstances: [
                {
                    name: "Default",
                    hostname: canvasHostname,
                    apiKey: canvasApiKey,
                    id: new URL(canvasHostname).hostname.split(".")[0] || "canvas"
                }
            ],
            ...settings,
            canvasHostname: undefined,
            canvasApiKey: undefined
        };

        await fs.writeFile(
            `${this.dataDirectory}/settings.json`,
            JSON.stringify(newSettings, null, 2), "utf8"
        );
    }
}