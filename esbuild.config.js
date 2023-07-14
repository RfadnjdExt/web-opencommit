import fs from "fs";
import esbuild from "esbuild";

const buildOptions = {
    entryPoints: ["./src/cli.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: "./out/cli.cjs",
};

esbuild.buildSync(buildOptions);

const sourceFilePath = "./src/chat_api_interaction.js";
const destinationFilePath = "./out/chat_api_interaction.js";

try {
    fs.copyFileSync(sourceFilePath, destinationFilePath);
} catch (err) {
    console.error("An error occurred while copying the file:", err);
}
