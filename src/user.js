import { serverName, serverVersion } from "./data.js";
import { User } from "./public-user.js";

// 成功连接的所有用户
export const users = new Map();

export class ServerUser extends User {
  constructor(...args) {
    super(...args);
  }

  // 初始化主动推送的逻辑
  async init(res) {
    this._res = res;

    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // 及时发送刷新响应头
    res.flushHeaders();

    // 发送初始化数据
    this.post({
      __type: "init",
      serverName,
      serverVersion,
    });

    this.post({
      __type: "update-user",
      users: Array.from(users).map((e) => {
        console.log(e);
        const user = e[1];

        return {
          id: e[0],
          data: user.data,
          sign: this.dataSignature,
        };
      }),
    });

    // 添加到总用户数组
    users.set(this.id, this);

    // 如果客户端关闭连接，停止发送事件
    res.on("close", () => {
      res.end();
      this.onclose && this.onclose();
      users.delete(this.id);
    });
  }

  post(data) {
    this._res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  close() {
    this._res && this._res.end();
    this.onclose && this.onclose();
    users.delete(this.id);
  }
}
