import { EventEmitter } from "events";

export class Stream {
    public static async create<T extends EventEmitter>(create: () => T): Promise<T> {
        const result = create();
        let onOpen: () => void;
        let onError: (reason?: any) => void;

        try {
            await new Promise<void>((resolve, reject) => {
                onOpen = resolve;
                onError = reject;
                result.on("open", onOpen).on("error", onError);
            });

            return result;
        } finally {
            // tslint:disable-next-line:no-non-null-assertion no-unnecessary-type-assertion
            result.removeListener("open", onOpen!);
            // tslint:disable-next-line:no-non-null-assertion no-unnecessary-type-assertion
            result.removeListener("error", onError!);
        }
    }
}
