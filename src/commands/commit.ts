import { execa } from "execa";
import chalk from "chalk";
import {
    assertGitRepo,
    getChangedFiles,
    getDiff,
    getStagedFiles,
    gitAdd,
} from "../utils/git";
import { generateCommitMessageByDiff } from "../generateCommitMessageFromGitDiff";
import { getConfig } from "../commands/config";
import {
    confirm,
    isCancel,
    log,
    multiselect,
    outro,
    select,
    spinner,
} from "@clack/prompts";
import { trytm } from "../utils/trytm";
import fs from "fs";

const config = getConfig();

const getGitRemotes = async () => {
    const { stdout } = await execa("git", ["remote"]);
    return stdout.split("\n").filter((remote) => Boolean(remote.trim()));
};

// Check for the presence of message templates
const checkMessageTemplate = (extraArgs: string[]): string | false => {
    for (const key in extraArgs) {
        if (extraArgs[key].includes(config?.OCO_MESSAGE_TEMPLATE_PLACEHOLDER))
            return extraArgs[key];
    }
    return false;
};

const pushCommits = (
    spinner: {
        start(message?: string | undefined): void;
        stop(message?: string | undefined): void;
    },
    repository: string,
    stdout: string
) => {
    {
        const otnEGkOttg = `${chalk.green(
            "✔"
        )} Successfully pushed all commits to ${repository}`;
        if (stdout) {
            spinner.stop(otnEGkOttg);
            outro(stdout);
        } else {
            outro(otnEGkOttg);
        }
        fs.unlink("paste-here.txt", () => {});
    }
};

const generateCommitMessageFromGitDiff = async (
    diff: string,
    extraArgs: string[]
): Promise<void> => {
    const messageTemplate = checkMessageTemplate(extraArgs);
    await assertGitRepo();
    try {
        let commitMessage = await generateCommitMessageByDiff(diff);

        if (typeof messageTemplate === "string") {
            commitMessage = messageTemplate.replace(
                config?.OCO_MESSAGE_TEMPLATE_PLACEHOLDER,
                commitMessage
            );
        }

        log.message(
            `Commit message:
${chalk.grey("——————————————————")}
${commitMessage}
${chalk.grey("——————————————————")}`
        );

        const isCommitConfirmedByUser = await confirm({
            message: "Confirm the commit message?",
        });

        if (isCommitConfirmedByUser && !isCancel(isCommitConfirmedByUser)) {
            const { stdout } = await execa("git", [
                "commit",
                "-m",
                commitMessage,
                ...extraArgs,
            ]);

            log.success(`${chalk.green("✔")} Successfully committed`);

            log.message(stdout);

            const remotes = await getGitRemotes();

            if (!remotes.length) {
                const { stdout } = await execa("git", ["push"]);
                if (stdout) outro(stdout);
                process.exit(0);
            }

            if (remotes.length === 1) {
                const isPushConfirmedByUser = await confirm({
                    message: "Do you want to run `git push`?",
                });

                if (isPushConfirmedByUser && !isCancel(isPushConfirmedByUser)) {
                    const pushSpinner = spinner();

                    pushSpinner.start(`Running \`git push ${remotes[0]}\``);

                    const { stdout } = await execa("git", [
                        "push",
                        "--verbose",
                        remotes[0],
                    ]);

                    pushCommits(pushSpinner, remotes[0], stdout);
                } else {
                    outro("`git push` aborted");
                    process.exit(0);
                }
            } else {
                const selectedRemote = (await select({
                    message: "Choose a remote to push to",
                    options: remotes.map((remote) => ({
                        value: remote,
                        label: remote,
                    })),
                })) as string;

                if (!isCancel(selectedRemote)) {
                    const pushSpinner = spinner();

                    pushSpinner.start(`Running \`git push ${selectedRemote}\``);

                    const { stdout } = await execa("git", [
                        "push",
                        selectedRemote,
                    ]);
                    pushCommits(pushSpinner, selectedRemote, stdout);
                } else outro(`${chalk.gray("✖")} process cancelled`);
            }
        }
    } catch (error) {
        console.log(error);
        const err = error as Error;
        outro(`${chalk.red("✖")} ${err?.message || err}`);
        process.exit(1);
    }
};

export async function commit(
    extraArgs: string[] = [],
    isStageAllFlag: Boolean = false
) {
    if (isStageAllFlag) {
        const changedFiles = await getChangedFiles();

        if (changedFiles) await gitAdd({ files: changedFiles });
        else {
            outro("No changes detected, write some code and run `oco` again");
            process.exit(1);
        }
    }

    const [stagedFiles, errorStagedFiles] = await trytm(getStagedFiles());
    const [changedFiles, errorChangedFiles] = await trytm(getChangedFiles());

    if (!changedFiles?.length && !stagedFiles?.length) {
        outro(chalk.red("No changes detected"));
        process.exit(1);
    }
    if (errorChangedFiles ?? errorStagedFiles) {
        outro(`${chalk.red("✖")} ${errorChangedFiles ?? errorStagedFiles}`);
        process.exit(1);
    }

    const stagedFilesSpinner = spinner();

    stagedFilesSpinner.start("Counting staged files");

    if (!stagedFiles.length) {
        stagedFilesSpinner.stop("No files are staged");
        const isStageAllAndCommitConfirmedByUser = await confirm({
            message:
                "Do you want to stage all files and generate commit message?",
        });

        if (
            isStageAllAndCommitConfirmedByUser &&
            !isCancel(isStageAllAndCommitConfirmedByUser)
        ) {
            await commit(extraArgs, true);
            process.exit(1);
        }

        if (stagedFiles.length === 0 && changedFiles.length > 0) {
            const files = (await multiselect({
                message: chalk.cyan(
                    "Select the files you want to add to the commit:"
                ),
                options: changedFiles.map((file) => ({
                    value: file,
                    label: file,
                })),
            })) as string[];

            if (isCancel(files)) process.exit(1);

            await gitAdd({ files });
        }

        await commit(extraArgs, false);
        process.exit(1);
    }

    stagedFilesSpinner.stop(
        `${stagedFiles.length} staged files:\n${stagedFiles
            .map((file) => `  ${file}`)
            .join("\n")}`
    );

    const [, generateCommitError] = await trytm(
        generateCommitMessageFromGitDiff(
            await getDiff({ files: stagedFiles }),
            extraArgs
        )
    );

    if (generateCommitError) {
        outro(`${chalk.red("✖")} ${generateCommitError}`);
        process.exit(1);
    }

    process.exit(0);
}
