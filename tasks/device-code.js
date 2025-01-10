const sUSers = new Map();

export default async ({ fromUser, data }) => {
  const { setCode, getUser, remove } = data;

  if (setCode) {
    // 设置设备码
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
    // 根据设备码获取用户
    const targetUser = sUSers.get(getUser);

    if (targetUser) {
      // 顺便给目标用户发送有用户请求了你的数据
      targetUser.send({
        __type: "get-user-card",
        data: {
          code: getUser,
          way: "device-code",
          userId: fromUser.id,
          userData: fromUser.data,
        },
      });

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
