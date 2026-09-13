"use strict";

module.exports = {
  name: "channel-guard",

  checkEvent(event = {}) {
    return {
      suspicious: false,
      event
    };
  }
};
