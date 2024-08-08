import express from "express";
import cors from "cors";
import { ServerUser, users } from "./src/user.js";

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

  console.log("所有用户: ", users);
});

app.post("/post/:userid", (req, res) => {
  console.log();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
