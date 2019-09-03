import { AddressObject, ParsedMail, simpleParser, SimpleParserOptions } from "mailparser";

import { Path } from "./Path";

interface IMessage {
    readonly from: AddressObject;
    readonly to?: AddressObject;
    readonly cc?: AddressObject;
    readonly bcc?: AddressObject;
    readonly date: Date;
    readonly subject: string;
}

interface ISenders {
    [from: string]: [IMessage, ...IMessage[]];
}

class App {
    public static async main() {
        const emailPath = new Path("/home", "andreas", "Downloads", "Received");
        const senders = App.sort(await App.processEmail(emailPath));
        await App.createOutput(senders);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // In Excel 1900/01/01 00:00 is represented as the number 1.0
    // (https://gist.github.com/christopherscott/2782634#gistcomment-1274743). Moreover, Excel incorrectly assumes that
    // 1900 was a leap year
    // (https://support.microsoft.com/en-us/help/214326/excel-incorrectly-assumes-that-the-year-1900-is-a-leap-year).
    // The 0-based epoch therefore starts at 1899/12/30. Finally, the months in js are 0-based...
    private static readonly excelEpochStartOffset = new Date(1899, 11, 30).getTime() / 1000 / 60 / 60 / 24;

    // Obviously, the types are wrong about options.
    private static readonly options: SimpleParserOptions = {
        skipHtmlToText: true,
        skipImageLinks: true,
        skipTextToHtml: true,
        skipTextLinks: true,
    } as any;

    private static async processEmail(path: Path) {
        const senders: ISenders = {};

        for (const emailFile of await path.getFiles()) {
            App.add(senders, await simpleParser(await emailFile.openRead(), App.options));
        }

        return senders;
    }

    private static sort(senders: ISenders) {
        for (const fromAddress of Object.keys(senders)) {
            senders[fromAddress].sort((a, b) => b.date.valueOf() - a.date.valueOf());
        }

        const result: ISenders = {};

        for (const entry of Object.entries(senders).sort((a, b) => b[1][0].date.valueOf() - a[1][0].date.valueOf())) {
            result[entry[0]] = entry[1];
        }

        return result;
    }

    private static async createOutput(senders: ISenders) {
        const outputStream = await new Path("/home", "andreas", "Downloads", "received.csv").openWrite();
        outputStream.write("From,Date,Subject,To,CC,BCC\n");

        try {
            for (const fromAddress of Object.keys(senders)) {
                outputStream.write(`${fromAddress},,,,,\n`);

                for (const message of senders[fromAddress]) {
                    const date = message.date.valueOf() / 1000 / 60 / 60 / 24 - App.excelEpochStartOffset;
                    const subject = App.escape(message.subject);
                    const to = App.getText(message.to);
                    const cc = App.getText(message.cc);
                    const bcc = App.getText(message.bcc);
                    outputStream.write(`,${date},"${subject}","${to}","${cc}","${bcc}"\n`);
                }
            }
        } finally {
            outputStream.close();
        }
    }

    private static escape(subject: string) {
        return subject.replace("\"", "\"\"");
    }

    private static add(senders: ISenders, { from, to, cc, bcc, date, subject }: ParsedMail) {
        const fromAddress = from.value[0].address;
        const message: IMessage = { from, to, cc, bcc, date: date || new Date(0), subject };

        if (!senders.hasOwnProperty(fromAddress)) {
            senders[fromAddress] = [message];
        } else {
            senders[fromAddress].push(message);
        }
    }

    private static getText(address?: AddressObject) {
        return address && address.text || "";
    }
}

App.main().catch((reason) => {
    console.error(reason);
    process.exitCode = 1;
});
