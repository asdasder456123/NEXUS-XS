"use strict";

module.exports = {
  name: "anti-mention",

  check(message, options = {}) {
    const limit = options.limit ?? 5;
    const mentions = message?.mentions?.users?.size ?? 0;

    return {
      safe: mentions < limit,
      mentions
    };
  }
};
