"use strict";

module.exports = {
  name: "logs",

  async send(guild, channelName, text) {
    if (!guild || !channelName || !text) return false;

    const channel = guild.channels.cache.find(
      channel => channel.name === channelName
    );

    if (!channel?.isTextBased()) return false;

    try {
      await channel.send(text);
      return true;
    } catch {
      return false;
    }
  }
};
