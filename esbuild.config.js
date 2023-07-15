import fs, { cpSync } from "fs";
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
    cpSync("./src/chat_api_interaction.js", "./out/chat_api_interaction.js");
    esbuild.buildSync(buildOptions);
} catch (err) {
    console.error("An error occurred during build or file copy:", err);
}
