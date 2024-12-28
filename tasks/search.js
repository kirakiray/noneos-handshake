import { users } from "../src/user.js";

export default async ({ fromUser, data }) => {
  const targetUser = users.get(data.userId);

  const respData = {
    ok: 1,
  };

  if (targetUser) {
    respData.user = {
      data: targetUser.data,
      sign: targetUser.dataSignature,
    };
  }

  return respData;
};
