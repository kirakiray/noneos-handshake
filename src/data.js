import { createRequire } from "module";
const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

export const serverVersion = packageJson.version;
