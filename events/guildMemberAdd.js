const { Events, EmbedBuilder } = require("discord.js");
const db = require("../database");
const config = require("../config.json");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(gMember) {
    try {
      const userId = gMember.id;
      if (!(await db.getUser(userId))) {
        await db.addUser(userId, gMember.user.username);
      }
      const welcomeMessage = await db.getWelcomeMessage(gMember.guild.id);

      if (!welcomeMessage) return;

      const channelId = config.welcomeChannelId;
      const channel = gMember.guild.channels.cache.get(channelId);

      if (channel) {
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Welcome!")
              .setDescription(
                welcomeMessage.replace("{user}", `<@${gMember.id}>`)
              )
              .setColor("Blue")
              .setTimestamp(),
          ],
          content: `<@${gMember.id}>`,
        });
      }
    } catch (error) {
      console.error("Error handling GuildMemberAdd event:", error);
    }
  },
};
