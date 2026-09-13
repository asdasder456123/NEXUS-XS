"use strict";

const automod = require("./automod");
const moderation = require("./moderation");
const logs = require("./logs");
const cases = require("./cases");
const permissions = require("./permissions");

module.exports = {
  automod,
  moderation,
  logs,
  cases,
  permissions
};
