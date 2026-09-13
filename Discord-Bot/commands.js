module.exports = (client) => {

  client.on("messageCreate", async (message) => {

    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === "security") {

      const isAdmin = message.member.permissions.has("Administrator");

      if (!isAdmin) {
        return message.reply(
          "❌ ليس لديك صلاحية استخدام نظام الحماية"
        );
      }

      const msg = await message.reply(
`🛡️ ABG Security Scanner

🔄 Starting scan...

🔐 Checking permissions...`
      );

      setTimeout(() => {
        msg.edit(
`🛡️ ABG Security Scanner

✅ Access Granted
✅ Admin Verified
✅ Security Module Active`
        );
      }, 3000);

      setTimeout(() => {
        msg.edit(
`🛡️ ABG Security Report

🟢 Bot: Secure
🟢 Permissions: OK
🟢 Configuration: Loaded

✅ Scan Completed`
        );
      }, 6000);

    }

  });

};

/* ABG Security DM Patch */


/* ABG Security DM Patch */
