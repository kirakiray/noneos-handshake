import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { verifyMessage, getHash } from "./util.js";
import { User } from "./user.js";

const app = express();
const port = 5569;
const serverVersion = process.env.npm_package_version;
let serverName = "test-noneos-handshake";

app.use(cors());

// 设置请求体大小限制为4KB，防止恶意请求爆内存
app.use(bodyParser.json({ limit: "4kb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "4kb" }));
app.use(bodyParser.raw({ limit: "4kb" }));
app.use(bodyParser.text({ limit: "4kb" }));

// 服务器信息入口
app.post("/user", async (req, res) => {
  try {
    const { data, sign } = req.body;

    const user = new User(data, sign);

    const result = await user.verify();

    if (result) {
      res.send(
        JSON.stringify({
          serverVersion,
          serverName,
          get: `/get/${user.id}`,
          sse: `/sse/${user.id}`,
        })
      );
    }
  } catch (err) {
    console.error(err);
    res.status(404).send(err.stack || err.toString());
  }
});

app.post("/post/:userid", (req, res) => {});

app.get("/sse/:userid", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  // 及时发送刷新响应头
  res.flushHeaders();
  const intervalID = setInterval(() => {
    const data = {
      pong: 1,
    };

    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 10000);

  // 如果客户端关闭连接，停止发送事件
  res.on("close", () => {
    console.log("客户端断开连接");
    clearInterval(intervalID);
    res.end();
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
