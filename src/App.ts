import { simpleParser, SimpleParserOptions } from "mailparser";

import { Path } from "./Path";

type ISubjects = Map<string, number>;

interface ISenders {
    [from: string]: ISubjects;
}

class App {
    public static async main() {
        try {
            const path = new Path("/home", "andreas", "Downloads", "2014", "Received");
            const senders: ISenders = {};

            for (const emailFile of await path.getFiles()) {
                await App.processEmail(senders, emailFile);
            }

            App.removeSubjects(senders);

            for (const from of Object.keys(senders)) {
                console.log(from);

                for (const entry of senders[from].entries()) {
                    console.log(`${entry[1].toString().padStart(3, "0")}        ${entry[0]}`);
                }
            }

            return 0;
        } catch (e) {
            console.log(e);

            return 1;
        }
    }

    private static readonly options: SimpleParserOptions = {
        skipHtmlToText: true,
        skipImageLinks: true,
        skipTextToHtml: true,
        skipTextLinks: true,
    } as any;

    private static async processEmail(senders: ISenders, emailFile: Path) {
        // Obviously, the types are wrong about options.
        const parsed = await simpleParser(await emailFile.openRead(), App.options);
        App.addSubject(App.getSubjects(senders, parsed.from.value[0].address), parsed.subject);
    }

    private static removeSubjects(senders: ISenders) {
        for (const from of Object.keys(senders)) {
            const subjects = Array.from(senders[from]);
            subjects.sort((a, b) => b[1] - a[1]);
            senders[from] = new Map(subjects.slice(0, 3));
        }
    }

    private static getSubjects(senders: ISenders, fromAddress: string) {
        if (!senders.hasOwnProperty(fromAddress)) {
            senders[fromAddress] = new Map<string, number>();
        }

        return senders[fromAddress];
    }

    private static addSubject(subjects: ISubjects, subject: string) {
        subjects.set(subject, (subjects.get(subject) || 0) + 1);
    }
}

// The catch should never be reached (because we handle all errors in main). If it does, we let the whole thing fail.
App.main().then((exitCode) => process.exitCode = exitCode).catch(() => process.exitCode = 1);
