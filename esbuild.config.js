import fs from "fs";
import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const buildOptions = {
    entryPoints: ["./src/cli.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: "./out/cli.cjs",
};

try {
    esbuild.buildSync(buildOptions);
    const sourceFilePath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "./src/chat_api_interaction.js"
    );
    const destinationFilePath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "./out/chat_api_interaction.js"
    );
    fs.copyFileSync(sourceFilePath, destinationFilePath);
} catch (err) {
    console.error("An error occurred during build or file copy:", err);
}
