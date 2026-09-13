"use strict";

module.exports = {
  name: "anti-nuke",

  checkEvent(event = {}) {
    return {
      suspicious: false,
      event
    };
  }
};
