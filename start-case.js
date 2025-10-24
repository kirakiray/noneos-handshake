import { initServer } from "./dist/index.js";

const server = await initServer({
  port: 5579,
  serverName: "test-handserver",
});
