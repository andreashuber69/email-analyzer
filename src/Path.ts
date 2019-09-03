import { createReadStream, createWriteStream, lstat, readdir, Stats } from "fs";
import { join } from "path";

import { Stream } from "./Stream";

export class Path {
    public readonly path: string;

    public constructor(...paths: string[]) {
        this.path = join(...paths);
    }

    public getStats() {
        return new Promise<Stats>(
            (resolve, reject) => lstat(this.path, (err, stats) => err ? reject(err) : resolve(stats)));
    }

    public getFiles() {
        return new Promise<Path[]>((resolve, reject) => readdir(this.path, (err, files) =>
            err ? reject(err) : resolve(files.map((value) => new Path(join(this.path, value))))));
    }

    public openRead() {
        return Stream.create(() => createReadStream(this.path));
    }

    public openWrite() {
        return Stream.create(() => createWriteStream(this.path));
    }
}
