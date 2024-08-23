import packageJson from "../package.json" assert { type: "json" };

export const serverVersion = packageJson.version;
export const serverName = "test-noneos-handshake";
export const serverID = Math.random().toString(32).slice(2);
