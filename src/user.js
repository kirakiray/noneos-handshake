import { serverName, serverVersion, serverID } from "./data.js";
import { User } from "./public-user.js";

// 成功连接的所有用户
export const users = new Map();

export const apiIDs = new Map();

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

    const _apiID = (this._apiID = Math.random().toString(32).slice(2));

    // 及时发送刷新响应头
    res.flushHeaders();

    // 添加到总用户数组
    users.set(this.id, this);
    // 添加入口
    apiIDs.set(_apiID, this);

    // 如果客户端关闭连接，停止发送事件
    res.on("close", () => {
      this.close();
      users.delete(this.id);
      apiIDs.delete(_apiID);

      console.log("用户断开连接: ", this);
    });

    // 发送初始化数据
    this.send({
      __type: "init",
      serverName,
      serverVersion,
      serverID,
      apiID: "/post/" + _apiID,
    });
  }

  send(data) {
    this._res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  close() {
    this._res && this._res.end();
    this.onclose && this.onclose();
    users.delete(this.id);
    apiIDs.delete(this._apiID);
  }
}
