/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, ".env");
const destination = path.join(__dirname, "node_modules/react-email/.env");

fs.copyFileSync(source, destination);
console.log("✅ .env file copied successfully!");
