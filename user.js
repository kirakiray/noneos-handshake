import { verifyMessage, getHash } from "./util.js";

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
    const sign = this.#signStr;

    const signPublic = data.find((e) => e[0] === "signPublic")[1];
    const userID = data.find((e) => e[0] === "userID")[1];

    // 验证id没问题
    const userIdOK = (await getHash(signPublic)) === userID;

    if (!userIdOK) {
      throw new Error(`Verification userID failed`);
    }

    // 验证签名没问题
    const result = await verifyMessage(JSON.stringify(data), sign, signPublic);

    if (!result) {
      throw new Error("Signature verification failed");
    }

    return true;
  }
}
