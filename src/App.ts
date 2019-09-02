import { simpleParser } from "mailparser";

class App {
    public static async main() {
        try {
            const parsed = await simpleParser(`Subject: Blah
`);

            return 0;
        } catch (e) {
            console.log(e);

            return 1;
        }
    }
}

// The catch should never be reached (because we handle all errors in main). If it does, we let the whole thing fail.
App.main().then((exitCode) => process.exitCode = exitCode).catch(() => process.exitCode = 1);
