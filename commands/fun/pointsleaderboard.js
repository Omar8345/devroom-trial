const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pointsleaderboard")
    .setDescription("Displays the top 3 users with the highest points."),

  async execute(interaction) {
    try {
      const topUsers = await db.getTopUsersPoints(3);

      if (!topUsers || topUsers.length === 0) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Points Leaderboard")
              .setDescription("No users have earned points yet.")
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
        .map(
          (user, index) =>
            `**${index + 1}.** <@${user.id}> - **${user.points} Points**`
        )
        .join("\n");

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Points Leaderboard")
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
      console.error("Error fetching points leaderboard:", error);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              "An error occurred while fetching the points leaderboard."
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
