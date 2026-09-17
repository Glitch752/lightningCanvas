import { dataDirectory } from "../data";

export abstract class Migration {
    getName(): string {
        return this.constructor.name;
    }

    get dataDirectory(): string {
        return dataDirectory;
    }
    
    abstract up(): Promise<void>;
}