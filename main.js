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

app.post("/post/:aid", (req, res) => {
  const { aid } = req.params;

  const fromUser = apiIDs.get(aid);
  if (fromUser) {
    try {
      const data = JSON.parse(req.body);

      if (data.agent) {
        const targetUser = users.get(data.agent.targetId);

        // 向目标用户发送连接请求
        if (!targetUser) {
          res.status(400).send({
            error: "Target does not exist",
          });
          return;
        }

        targetUser.send({
          __type: "agent-connect",
          fromUserID: fromUser.id,
          fromUser: {
            data: fromUser.data,
            sign: fromUser.dataSignature,
          },
          data: data.agent.data,
        });
      } else if (data.getUser) {
        const { userID } = data.getUser;

        const targetUser = users.get(userID);

        if (targetUser) {
          res.status(200).send({
            ok: 1,
            data: {
              user: targetUser.data,
              sign: targetUser.dataSignature,
            },
          });
          return;
        }

        res.status(200).send({ error: "not online" });
        return;
      }

      res.status(200).send({ ok: 1 });
    } catch (err) {
      res.status(404).send(err.stack || err.toString());
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
