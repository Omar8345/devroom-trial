const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("Set the welcome message for new members.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The welcome message to display.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const hasPermission = interaction.member.roles.cache.some((role) =>
      config.modRoleIds.includes(role.id)
    );
    if (!hasPermission) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Insufficient Permissions")
            .setDescription("You do not have permission to use this command.")
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

    const message = interaction.options.getString("message");

    try {
      await db.setWelcomeMessage(interaction.guild.id, message);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Welcome Message Set")
            .setDescription(
              `Successfully set the welcome message to:\n\n\`${message}\``
            )
            .setColor("Green")
            .setTimestamp()
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            }),
        ],
      });
    } catch (error) {
      console.error("Error setting welcome message:", error);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              "An error occurred while setting the welcome message."
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
