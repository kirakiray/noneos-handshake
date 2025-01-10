// import { ServerUser, apiIDs, users } from "../src/user.js";
import { users } from "../src/user.js";

export default async ({ fromUser, data }) => {
  // 用户数据代理
  const targetUser = users.get(data.targetId);

  // 向目标用户发送连接请求
  if (!targetUser) {
    throw new Error("Target does not exist");
  }

  targetUser.send({
    __type: "agent-connect",
    fromUserID: fromUser.id,
    fromUser: {
      data: fromUser.data,
      sign: fromUser.dataSignature,
    },
    data: data.data,
  });

  return { ok: 1 };
};
