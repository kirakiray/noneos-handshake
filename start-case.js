import { initServer } from "./dist.js";

const wss = initServer({
  port: 5579,
  name: "test-handserver",
});
