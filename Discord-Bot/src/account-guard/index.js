"use strict";

module.exports = {
  name: "account-guard",

  check(member, options = {}) {
    const minAgeMs = options.minAgeMs ?? 86400000;
    const created = member?.user?.createdTimestamp;

    if (!created) {
      return { suspicious: false };
    }

    return {
      suspicious: Date.now() - created < minAgeMs,
      accountAgeMs: Date.now() - created
    };
  }
};
