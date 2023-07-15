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
    fs.writeFileSync(
        "./out/chat_api_interaction.js",
        fs.readFileSync("./src/chat_api_interaction.js")
    );
} catch (err) {
    console.error("An error occurred during build or file copy:", err);
}
