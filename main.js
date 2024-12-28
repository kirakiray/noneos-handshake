import express from "express";
import cors from "cors";
import { ServerUser, apiIDs, users } from "./src/user.js";

export default class HandShakeServer {
  #serverName;
  #serverID;
  #app;
  #allows;
  constructor(opts) {
    const { port, name: serverName, allows } = opts || {};

    this.#allows = allows;

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

    const userEntry = `/user`;

    // 服务器信息入口
    app.get(`${userEntry}/:body`, async (req, res) => {
      try {
        const { data, sign, sessionID, serverSign } = JSON.parse(
          req.params.body
        );

        const user = new ServerUser(data, sign, {
          serverName,
          serverID,
          sessionID,
        });

        // 验证用户信息签名没错才能继续
        const userSignResult = await user.verify();

        // 当前请求的服务器请求入口地址
        const allows = this.#allows;
        let serverSignResult = false;
        for (let i = 0; i < allows.length; i++) {
          const signServerUrl = allows[i];
          serverSignResult = await user.verify(signServerUrl, serverSign);
          if (serverSignResult) {
            break;
          }
        }

        if (userSignResult && serverSignResult) {
          await user.init(res);
          return;
        }

        res.status(400).send("sign not ok");

        console.log("init: ", user);
      } catch (err) {
        console.error(err);
        res.status(400).send(err.stack || err.toString());
      }
    });

    app.post("/post/:aid", async (req, res) => {
      const { aid } = req.params;

      const fromUser = apiIDs.get(aid);
      if (fromUser) {
        try {
          const data = JSON.parse(req.body);

          if (data.ping) {
            res.status(200).send({
              pong: 1,
            });
            return;
          }

          if (data.type) {
            const task = await getTask(data.type);

            const result = await task({
              fromUser,
              data,
            });

            res.status(200).send(result);
            return;
          }

          res.status(404).send("");
        } catch (err) {
          res.status(400).send(err.stack || err.toString());
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

const tasks = {};

// 获取任务
const getTask = async (taskName) => {
  if (tasks[taskName]) {
    return tasks[taskName];
  }

  const task = await import(`./tasks/${taskName}.js`);
  tasks[taskName] = task.default;

  return task.default;
};
