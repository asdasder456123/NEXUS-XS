"use strict";

module.exports = {
  name: "moderation",

  canModerate(member) {
    return Boolean(member?.moderatable);
  },

  async timeout(member, durationMs, reason = "Security action") {
    if (!this.canModerate(member)) return false;

    try {
      await member.timeout(durationMs, reason);
      return true;
    } catch {
      return false;
    }
  }
};
