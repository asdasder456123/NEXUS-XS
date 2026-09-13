"use strict";

module.exports = {
  name: "automod",

  checkMessage(message, options = {}) {
    if (!message || message.author?.bot) return null;

    const content = String(message.content || "").trim();

    if (!content) return null;

    const maxRepeated = options.maxRepeatedMessages ?? 5;

    return {
      safe: true,
      reason: null,
      repeated: false,
      maxRepeated
    };
  }
};
