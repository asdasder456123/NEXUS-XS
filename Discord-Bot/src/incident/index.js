"use strict";

const incidents = [];

module.exports = {
  name: "incident",

  create(data = {}) {
    const incident = {
      id: incidents.length + 1,
      type: data.type || "unknown",
      guildId: data.guildId || null,
      userId: data.userId || null,
      reason: data.reason || null,
      timestamp: Date.now()
    };

    incidents.push(incident);
    return incident;
  },

  list() {
    return [...incidents];
  }
};
