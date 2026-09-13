"use strict";

const automod = require("./automod");
const moderation = require("./moderation");
const logs = require("./logs");
const cases = require("./cases");
const permissions = require("./permissions");

const antiRaid = require("./anti-raid");
const antiMention = require("./anti-mention");
const antiDuplicate = require("./anti-duplicate");
const antiNuke = require("./anti-nuke");
const linkGuard = require("./link-guard");
const accountGuard = require("./account-guard");
const channelGuard = require("./channel-guard");
const roleGuard = require("./role-guard");
const incident = require("./incident");

const helpers = {
  automod,
  moderation,
  logs,
  cases,
  permissions,
  antiRaid,
  antiMention,
  antiDuplicate,
  antiNuke,
  linkGuard,
  accountGuard,
  channelGuard,
  roleGuard,
  incident
};

function list() {
  return Object.values(helpers).map(helper => helper.name);
}

module.exports = {
  helpers,
  list
};
