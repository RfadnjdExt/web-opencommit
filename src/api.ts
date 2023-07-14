import {
    cancel,
    intro,
    log,
    outro,
    note,
    isCancel,
    text,
} from "@clack/prompts";
import axios from "axios";
import chalk from "chalk";
import {
    ChatCompletionRequestMessage,
    Configuration as OpenAiApiConfiguration,
    CreateChatCompletionRequest,
    OpenAIApi,
} from "openai";

import {
    CONFIG_MODES,
    DEFAULT_MODEL_TOKEN_LIMIT,
    getConfig,
} from "./commands/config";
import { tokenCount } from "./utils/tokenCount";
import { GenerateCommitMessageErrorEnum } from "./generateCommitMessageFromGitDiff";
import { execa } from "execa";
import { randomUUID } from "crypto";
import { readFileSync, statSync, watch, writeFileSync } from "fs";
import { format } from "util";
import path from "path";

const config = getConfig();

let maxTokens = config?.OCO_OPENAI_MAX_TOKENS;
let basePath = config?.OCO_OPENAI_BASE_PATH;
let apiKey = config?.OCO_OPENAI_API_KEY;

const [command, mode] = process.argv.slice(2);

if (!apiKey && command !== "config" && mode !== CONFIG_MODES.set) {
    intro("opencommit");

    outro(
        "OCO_OPENAI_API_KEY is not set, please run `oco config set OCO_OPENAI_API_KEY=<your token>. Make sure you add payment details, so API works.`"
    );
    outro(
        "For help look into README https://github.com/di-sukharev/opencommit#setup"
    );

    process.exit(1);
}

const MODEL = config?.OCO_MODEL || "gpt-3.5-turbo";
async function waitForFileContent(
    filePath: string,
    isEmpty: boolean
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        // setInterval(() => {
        //     const stats = statSync(filePath);
        //     const isFileEmpty = stats.size === 0;

        //     if ((isFileEmpty && isEmpty) || (!isFileEmpty && !isEmpty)) {
        //         resolve(readFileSync(filePath, "utf8"));
        //     }
        // }, 1e3);
        const watcher = watch(filePath, (eventType, _filename) => {
            if (eventType === "change") {
                const stats = statSync(filePath);
                const isFileEmpty = stats.size === 0;

                if ((isFileEmpty && isEmpty) || (!isFileEmpty && !isEmpty)) {
                    watcher.close();
                    resolve(readFileSync(filePath, "utf8"));
                }
            }
        });

        watcher.on("error", (error) => {
            reject(error);
        });
    });
}
class OpenAi {
    private openAiApiConfiguration = new OpenAiApiConfiguration({
        apiKey: apiKey,
    });
    openAI!: OpenAIApi;

    constructor() {
        if (basePath) {
            this.openAiApiConfiguration.basePath = basePath;
        }
        this.openAI = new OpenAIApi(this.openAiApiConfiguration);
    }

    public createChatCompletion = async (
        createChatCompletionRequest: CreateChatCompletionRequest
    ) => {
        const chatRequestJSON = JSON.stringify(
            JSON.stringify({
                action: "next",
                messages: createChatCompletionRequest.messages.map(
                    (message) => ({
                        id: randomUUID(),
                        author: {
                            role:
                                message.role === "system"
                                    ? "user"
                                    : message.role,
                        },
                        content: {
                            content_type: "text",
                            parts: [message.content],
                        },
                        metadata: {},
                    })
                ),
                parent_message_id: randomUUID(),
                model: "text-davinci-002-render-sha",
                timezone_offset_min: -420,
                history_and_training_disabled: false,
                arkose_token: null,
            })
        );
        log.step(
            `eval(atob(\`${Buffer.from(
                format(
                    readFileSync(
                        path.join(__filename, "..", "browser-code.js"),
                        "utf8"
                    ),
                    config?.OCO_OPENAI_API_KEY,
                    chatRequestJSON.slice(1, -1),
                    config?.OCO_OPENAI_API_KEY,
                    config?.OCO_OPENAI_API_KEY
                )
            ).toString("base64")}\`))\n\n`
        );

        const outputFile = "paste-here.txt"; // fix IDE linting error
        writeFileSync(outputFile, "");
        note(
            `Copy and paste the message above into the browser console, and copy the console result to the "${outputFile}" file.`
        );
        text({ message: "CTRL-C to cancel." }).then((userInput) => {
            if (isCancel(userInput)) {
                cancel();
                process.exit(1);
            }
        });

        const fileContent: string = await waitForFileContent(outputFile, false);

        log.success("Received paste data.");

        const decodedData = Buffer.from(fileContent, "base64")
            .toString()
            .split(/\s*data:\s*/);
        const parsedData = decodedData
            .map((item) => {
                try {
                    return JSON.parse(item);
                } catch (error) {}
            })
            .filter(Boolean);
        const lastMessage = parsedData[parsedData.length - 1];

        if (!lastMessage) throw parsedData;

        return {
            data: {
                choices: [
                    {
                        message: {
                            content: lastMessage.message.content.parts[0],
                        },
                    },
                ],
            },
        };
    };

    public generateCommitMessage = async (
        messages: Array<ChatCompletionRequestMessage>
    ): Promise<string | undefined> => {
        const params = {
            model: MODEL,
            messages,
            temperature: 0,
            top_p: 0.1,
            max_tokens: maxTokens || 500,
        };
        try {
            const REQUEST_TOKENS = messages
                .map((msg) => tokenCount(msg.content) + 4)
                .reduce((a, b) => a + b, 0);

            if (REQUEST_TOKENS > DEFAULT_MODEL_TOKEN_LIMIT - maxTokens) {
                throw new Error(GenerateCommitMessageErrorEnum.tooMuchTokens);
            }
            const { data } = await this.createChatCompletion(params);

            const message = data.choices[0].message;

            return message?.content;
        } catch (error) {
            outro(`${chalk.red("✖")} ${JSON.stringify(params)}`);

            const err = error as Error;
            outro(`${chalk.red("✖")} ${err?.message || err}`);

            if (
                axios.isAxiosError<{ error?: { message: string } }>(error) &&
                error.response?.status === 401
            ) {
                const openAiError = error.response.data.error;

                if (openAiError?.message) outro(openAiError.message);
                outro(
                    "For help look into README https://github.com/di-sukharev/opencommit#setup"
                );
            }

            throw err;
        }
    };
}

export const getOpenCommitLatestVersion = async (): Promise<
    string | undefined
> => {
    try {
        const { stdout } = await execa("npm", [
            "view",
            "opencommit",
            "version",
        ]);
        return stdout;
    } catch (_) {
        outro("Error while getting the latest version of opencommit");
        return undefined;
    }
};

export const api = new OpenAi();
