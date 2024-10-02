import HandShakeServer from "./main.js";

const server = new HandShakeServer({
  name: "test-server",
  port: 5569, // 服务器端口
  allows: ["http://localhost:5569"], // 允许的域名
});
