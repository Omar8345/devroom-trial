const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("xpleaderboard")
    .setDescription("Displays the top 3 users with the highest XP."),

  async execute(interaction) {
    try {
      const topUsers = await db.getTopUsersXP(3);

      if (!topUsers || topUsers.length === 0) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("XP Leaderboard")
              .setDescription("No users have earned XP yet.")
              .setColor("Yellow")
              .setTimestamp()
              .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
              }),
          ],
          ephemeral: true,
        });
      }

      const leaderboard = topUsers
        .map((user, index) => {
          const level = Math.floor(user.xp / 100);
          return `**${index + 1}.** <@${user.id}> - **${
            user.xp
          } XP** (Level ${level})`;
        })
        .join("\n");

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("XP Leaderboard")
            .setDescription(leaderboard)
            .setColor("Green")
            .setTimestamp()
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            }),
        ],
      });
    } catch (error) {
      console.error("Error fetching XP leaderboard:", error);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              "An error occurred while fetching the XP leaderboard."
            )
            .setColor("Red")
            .setTimestamp()
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            }),
        ],
        ephemeral: true,
      });
    }
  },
};
