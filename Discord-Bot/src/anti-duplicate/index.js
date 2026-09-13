"use strict";

const recent = new Map();

module.exports = {
  name: "anti-duplicate",

  check(userId, content) {
    const text = String(content || "").trim().toLowerCase();
    const previous = recent.get(userId);

    recent.set(userId, text);

    return {
      duplicate: Boolean(text && previous === text)
    };
  }
};
