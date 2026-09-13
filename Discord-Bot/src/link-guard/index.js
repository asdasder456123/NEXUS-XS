"use strict";

module.exports = {
  name: "link-guard",

  check(text) {
    const value = String(text || "");

    return {
      hasLink: /https?:\/\/\S+/i.test(value)
    };
  }
};
