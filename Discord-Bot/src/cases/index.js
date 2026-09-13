"use strict";

const cases = new Map();
let nextId = 1;

module.exports = {
  name: "cases",

  create(data = {}) {
    const id = nextId++;

    const record = {
      id,
      userId: data.userId || null,
      guildId: data.guildId || null,
      action: data.action || "unknown",
      reason: data.reason || "No reason",
      moderatorId: data.moderatorId || null,
      createdAt: Date.now()
    };

    cases.set(id, record);
    return record;
  },

  get(id) {
    return cases.get(id) || null;
  }
};
