const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const output = path.join(root, "dist");
const imageExtensions = new Set([
    ".avif",
    ".gif",
    ".ico",
    ".jpeg",
    ".jpg",
    ".png",
    ".svg",
    ".webp"
]);

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name === "server.js") continue;
    if (!/\.(html|css|js)$/i.test(entry.name)) continue;
    fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name));
}

function copyImages(source, destination) {
    fs.mkdirSync(destination, { recursive: true });

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const sourcePath = path.join(source, entry.name);
        const destinationPath = path.join(destination, entry.name);

        if (entry.isDirectory()) {
            copyImages(sourcePath, destinationPath);
        } else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
            fs.copyFileSync(sourcePath, destinationPath);
        }
    }
}

const images = path.join(root, "images");
if (!fs.existsSync(images)) {
    throw new Error("Required static asset directory is missing: images");
}

copyImages(images, path.join(output, "images"));
console.log("Built static site in dist/.");
