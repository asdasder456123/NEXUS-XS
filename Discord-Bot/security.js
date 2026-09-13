const { getSecurityConfig } = require("./config-loader");
const securityHelpers = require("./src/security-helpers");
const securityHub = require("./src/security-hub");

module.exports = (client) => {

  const security = securityHub.helpers;

  console.log("🛡️ Security Hub connected");
  console.log(`📦 Security modules: ${securityHub.list().length}`);

  // مراقبة الرسائل بدون تنفيذ عقوبات تلقائية
  client.on("messageCreate", async (message) => {
    if (message.author?.bot) return;

    try {
      // تأكد أن الرسالة مكتملة وقابلة للفحص قبل تشغيل أي Guard
      if (
        !message.id ||
        !message.author?.id ||
        typeof message.content !== "string"
      ) {
        return;
      }

      const content = message.content.trim();

      // تجاهل الرسائل الفارغة بدل اعتبارها تكرارًا
      if (!content) return;

      const mentionResult = security.antiMention.check(message);

      // افحص المحتوى الفعلي بعد التأكد من وصول الرسالة بشكل صحيح
      const duplicateResult = security.antiDuplicate.check(
        message.author.id,
        content
      );

      const linkResult = security.linkGuard.check(content);

      if (!mentionResult.safe) {
        console.log(
          `⚠️ Mention Guard: ${message.author.tag} mentions=${mentionResult.mentions}`
        );
      }

      if (duplicateResult.duplicate) {
        console.log(
          `⚠️ Duplicate Guard: ${message.author.tag}`
        );
      }

      if (linkResult.hasLink) {
        console.log(
          `🔗 Link Guard: ${message.author.tag}`
        );
      }
    } catch (err) {
      console.error("❌ Security Hub message check:", err.message);
    }
  });

  // مراقبة دخول الأعضاء
  client.on("guildMemberAdd", (member) => {
    try {
      const result = security.accountGuard.check(member);

      security.antiRaid.trackJoin(
        member.guild.id,
        member.user.id
      );

      if (result.suspicious) {
        console.log(
          `⚠️ Account Guard: new account ${member.user.tag}`
        );
      }
    } catch (err) {
      console.error("❌ Security Hub member check:", err.message);
    }
  });

  // مراقبة إنشاء/حذف القنوات والرتب
  client.on("channelCreate", (channel) => {
    try {
      security.channelGuard.checkEvent({
        type: "channelCreate",
        channelId: channel.id,
        guildId: channel.guild?.id
      });

      console.log(`📁 Channel Guard: channelCreate`);
    } catch (err) {
      console.error("❌ Channel Guard:", err.message);
    }
  });

  client.on("channelDelete", (channel) => {
    try {
      security.channelGuard.checkEvent({
        type: "channelDelete",
        channelId: channel.id,
        guildId: channel.guild?.id
      });

      console.log(`📁 Channel Guard: channelDelete`);
    } catch (err) {
      console.error("❌ Channel Guard:", err.message);
    }
  });

  client.on("roleCreate", (role) => {
    try {
      security.roleGuard.checkEvent({
        type: "roleCreate",
        roleId: role.id,
        guildId: role.guild?.id
      });

      console.log(`🔐 Role Guard: roleCreate`);
    } catch (err) {
      console.error("❌ Role Guard:", err.message);
    }
  });

  client.on("roleDelete", (role) => {
    try {
      security.roleGuard.checkEvent({
        type: "roleDelete",
        roleId: role.id,
        guildId: role.guild?.id
      });

      console.log(`🔐 Role Guard: roleDelete`);
    } catch (err) {
      console.error("❌ Role Guard:", err.message);
    }
  });

  console.log("🟢 Security Hub live monitoring enabled");

  const {
    automod,
    moderation,
    logs,
    cases,
    permissions
  } = securityHelpers;

  console.log("🛡️ Security helpers loaded:", [
    automod.name,
    moderation.name,
    logs.name,
    cases.name,
    permissions.name
  ].join(", "));

  const config = getSecurityConfig();

  if (
    !config ||
    !config.enabled
  ) {
    console.log("🛡️ ABG Security Disabled");
    return;
  }


  const warnings = new Map();
  const spam = new Map();


  const securityConfig = config;



  async function log(guild, text) {

    if (!guild) return;

    const channel =
      guild.channels.cache.find(
        c => c.name === securityConfig.logsChannel
      );

    if (channel) {
      channel.send(text).catch(()=>{});
    }

  }



  async function punish(message, reason) {

    await message.delete().catch(()=>{});


    const id =
      message.author.id;


    const count =
      (warnings.get(id) || 0) + 1;


    warnings.set(id, count);



    await log(
      message.guild,
`🚨 ABG Security Alert

👤 User:
${message.author.tag}

⚠️ Reason:
${reason}

📌 Warnings:
${count}`
    );



    if (
      securityConfig.warnings.enabled &&
      count >= securityConfig.warnings.timeoutAfter &&
      message.member &&
      message.member.moderatable
    ) {

      await message.member.timeout(
        securityConfig.antiSpam.timeoutMinutes * 60 * 1000,
        reason
      ).catch(()=>{});

    }

  }




  client.on("messageCreate", async message => {


    if (message.author.bot)
      return;



    const content =
      message.content.toLowerCase();



    // حماية الروابط

    if (
      securityConfig.antiLinks.enabled &&
      securityConfig.antiLinks.blockedWords.some(
        word => content.includes(word)
      )
    ) {

      if (
        securityConfig.antiLinks.deleteMessage
      ) {

        return punish(
          message,
          "Suspicious link/content"
        );

      }

    }




    // Anti Spam

    if (
      securityConfig.antiSpam.enabled
    ) {


      const id =
        message.author.id;


      const now =
        Date.now();



      if (!spam.has(id))
        spam.set(id, []);



      let times =
        spam.get(id);



      times.push(now);



      times =
        times.filter(
          t =>
          now -
          t <
          securityConfig.antiSpam.timeWindow
        );



      spam.set(id, times);



      if (
        times.length >=
        securityConfig.antiSpam.maxMessages
      ) {

        return punish(
          message,
          "Spam detected"
        );

      }

    }


  });





  if (
    securityConfig.monitor.roles
  ) {

    client.on("roleCreate", role => {

      log(
        role.guild,
        `🔐 Role Created: ${role.name}`
      );

    });



    client.on("roleDelete", role => {

      log(
        role.guild,
        `🗑️ Role Deleted: ${role.name}`
      );

    });

  }




  if (
    securityConfig.monitor.channels
  ) {

    client.on("channelDelete", channel => {

      if (channel.guild) {

        log(
          channel.guild,
          `🚨 Channel Deleted: ${channel.name}`
        );

      }

    });

  }




  console.log(
    "🛡️ ABG Security Config Loaded"
  );

};
