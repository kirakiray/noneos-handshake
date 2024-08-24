import express from "express";
import cors from "cors";
import { ServerUser, apiIDs, users } from "./src/user.js";

export default class HandShakeServer {
  #serverName;
  #serverID;
  #app;
  constructor(opts) {
    const { port, name: serverName } = opts || {};

    this.#serverName = serverName;
    const serverID = (this.#serverID = Math.random().toString(32).slice(2));

    const app = (this.#app = express());

    app.use(cors());

    // 设置请求体大小限制为4KB，防止恶意请求爆内存
    app.use(express.json({ limit: "4kb" }));
    app.use(express.urlencoded({ extended: false, limit: "4kb" }));
    app.use(express.raw({ limit: "4kb" }));
    app.use(express.text({ limit: "4kb" }));

    app.get("/recommends", async (req, res) => {
      res.status(200).send({
        ok: 1,
        data: {
          serverID,
          serverName,
          users: Array.from(users.values()).map((user) => {
            return {
              data: user.data,
              sign: user.dataSignature,
            };
          }),
        },
      });
    });

    // 服务器信息入口
    app.get("/user/:body", async (req, res) => {
      try {
        const { data, sign } = JSON.parse(req.params.body);

        const user = new ServerUser(data, sign, {
          serverName,
          serverID,
        });

        // 验证用户信息签名没错才能继续
        const result = await user.verify();

        if (result) {
          await user.init(res);
        }

        console.log("init: ", users);
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
            // 用户数据代理
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
            // 获取用户
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
          } else if (data.getRecommend) {
            // 获取推荐用户卡片数据
            res.status(200).send({
              ok: 1,
              data: Array.from(users.values()).map((user) => {
                return {
                  data: user.data,
                  sign: user.dataSignature,
                };
              }),
            });

            return;
          } else if (data.ping) {
            res.status(200).send({
              pong: 1,
            });

            return;
          }

          res.status(200).send({ ok: 1 });
        } catch (err) {
          res.status(404).send(err.stack || err.toString());
        }
      }
    });

    app.listen(port);
  }

  get name() {
    return this.#serverName;
  }

  get id() {
    return this.#serverID;
  }

  close() {
    this.#app.close();
  }
}
