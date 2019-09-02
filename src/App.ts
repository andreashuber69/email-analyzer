import { simpleParser, SimpleParserOptions } from "mailparser";

class App {
    public static async main() {
        try {
            // Obviously, the types are wrong about options.
            const options: SimpleParserOptions = {
                skipHtmlToText: true,
                skipImageLinks: true,
                skipTextToHtml: true,
                skipTextLinks: true,
            } as any;

            const parsed = await simpleParser("Subject: Blah", options);

            return 0;
        } catch (e) {
            console.log(e);

            return 1;
        }
    }
}

// The catch should never be reached (because we handle all errors in main). If it does, we let the whole thing fail.
App.main().then((exitCode) => process.exitCode = exitCode).catch(() => process.exitCode = 1);
