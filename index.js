import express from "express";
import cors from "cors";
import { ServerUser, apiIDs, users } from "./src/user.js";

const app = express();
const port = 5569;

app.use(cors());

// 设置请求体大小限制为4KB，防止恶意请求爆内存
app.use(express.json({ limit: "4kb" }));
app.use(express.urlencoded({ extended: false, limit: "4kb" }));
app.use(express.raw({ limit: "4kb" }));
app.use(express.text({ limit: "4kb" }));

// 服务器信息入口
app.get("/user/:body", async (req, res) => {
  try {
    const { data, sign } = JSON.parse(req.params.body);

    const user = new ServerUser(data, sign, {});

    // 验证用户信息签名没错才能继续
    const result = await user.verify();

    if (result) {
      await user.init(res);
    }
  } catch (err) {
    console.error(err);
    res.status(404).send(err.stack || err.toString());
  }
});

app.post("/post/:tempid", (req, res) => {
  const { tempid } = req.params;

  const fromUser = apiIDs.get(tempid);
  if (fromUser) {
    try {
      const data = JSON.parse(req.body);

      if (data.agent) {
        const targetUser = users.get(data.agent.targetId);

        // 向目标用户发送连接请求
        if (!targetUser) {
          res.status(400).send("Target does not exist");
          return;
        }

        targetUser.send({
          __type: "connect",
          fromUserID: fromUser.id,
          data: data.agent.data,
        });
      }

      res.status(200).send("ok");
    } catch (err) {
      res.status(404).send(err.stack || err.toString());
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
