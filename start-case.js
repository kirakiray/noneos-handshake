import { initServer } from "./dist.js";

const server = await initServer({
  port: 5579,
  serverName: "test-handserver",
});
