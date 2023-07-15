import fs, { cpSync } from "fs";
import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import { copy } from "esbuild-plugin-copy";

const buildOptions = {
    entryPoints: ["./src/cli.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: "./out/cli.cjs",
    plugins: [
        copy({
            resolveFrom: "cwd",
            assets: {
                from: ["./assets/*"],
                to: ["./out"],
            },
            watch: true,
        }),
    ],
};

try {
    esbuild.build(buildOptions);
} catch (err) {
    console.error("An error occurred during build or file copy:", err);
}
