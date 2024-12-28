const sUSers = new Map();

export default async ({ fromUser, data }) => {
  const { setCode, getUser, remove } = data;

  if (setCode) {
    if (sUSers.has(setCode)) {
      throw new Error("setCode is already in use");
    }

    if (fromUser.__setCodeClose) {
      throw new Error("fromUser is already in use");
    }

    sUSers.set(setCode, fromUser);

    const fn = (fromUser.__setCodeClose = () => {
      sUSers.delete(setCode);
      fromUser.__setCodeClose = null;
    });
    fromUser._closes.add(fn);

    console.log("set code", setCode);

    return {
      ok: 1,
    };
  } else if (getUser) {
    const targetUser = sUSers.get(getUser);

    if (targetUser) {
      return {
        ok: 1,
        user: {
          data: targetUser.data,
          sign: targetUser.dataSignature,
        },
      };
    }
  } else if (remove) {
    if (sUSers.get(remove) === fromUser) {
      // 确认是目标用户自己关闭
      sUSers.delete(remove);
      fromUser.__setCodeClose = null;
      console.log("remove code", remove);

      return {
        ok: 1,
      };
    } else {
      // TODO: 将目标用户加入黑名单
      throw new Error("you are not the target user");
    }
  }
};
