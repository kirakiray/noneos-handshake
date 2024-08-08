import { verifyMessage, getHash } from "./util.js";
import { serverName, serverVersion } from "./data.js";

// 成功连接的所有用户
export const users = new Map();

export class User {
  #data;
  #signStr;
  constructor(data, signStr) {
    this.#data = data;
    this.#signStr = signStr;
  }

  get id() {
    return this.#data.find((e) => e[0] === "userID")[1];
  }

  // 验证自身信息
  async verify() {
    const data = this.#data;

    const signPublic = data.find((e) => e[0] === "signPublic")[1];
    const userID = data.find((e) => e[0] === "userID")[1];

    // 验证id没问题
    const userIdOK = (await getHash(signPublic)) === userID;

    if (!userIdOK) {
      throw new Error(`Verification userID failed`);
    }

    // 验证签名没问题
    const result = await verifyMessage(
      JSON.stringify(data),
      this.#signStr,
      signPublic
    );

    if (!result) {
      throw new Error("Signature verification failed");
    }

    return true;
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
