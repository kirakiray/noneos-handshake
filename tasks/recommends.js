import { users } from "../src/user.js";

export default async ({ fromUser, data }) => {
  // 暂时禁用推荐用户
  return {
    ok: 1,
    data: [],
  };
  // return {
  //   ok: 1,
  //   data: Array.from(users.values()).map((user) => {
  //     return {
  //       data: user.data,
  //       sign: user.dataSignature,
  //     };
  //   }),
  // };
};
