"use strict";

module.exports = {
  name: "permissions",

  canManage(member) {
    return Boolean(
      member?.permissions?.has("ManageGuild") ||
      member?.permissions?.has("ModerateMembers")
    );
  },

  canAdministrator(member) {
    return Boolean(
      member?.permissions?.has("Administrator")
    );
  }
};
