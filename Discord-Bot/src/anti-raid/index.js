"use strict";

module.exports = {
  name: "anti-raid",

  trackJoin(guildId, userId) {
    return {
      guildId,
      userId,
      timestamp: Date.now()
    };
  }
};
