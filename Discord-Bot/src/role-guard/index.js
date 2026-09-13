"use strict";

module.exports = {
  name: "role-guard",

  checkEvent(event = {}) {
    return {
      suspicious: false,
      event
    };
  }
};
