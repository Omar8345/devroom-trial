const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embed: new EmbedBuilder()
            .setTitle("An error occurred")
            .setDescription("This command does not exist")
            .setColor("Red")
            .setTimestamp()
            .setFooter(
              `Requested by ${interaction.user.tag}`,
              interaction.user.displayAvatarURL()
            ),
        });
      } else {
        await interaction.reply({
          embed: new EmbedBuilder()
            .setTitle("An error occurred")
            .setDescription("This command does not exist")
            .setColor("Red")
            .setTimestamp()
            .setFooter(
              `Requested by ${interaction.user.tag}`,
              interaction.user.displayAvatarURL()
            ),
          ephemeral: true,
        });
      }
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(
        `❌ Error while executing command ${interaction.commandName}: ${error}`
      );
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embed: new EmbedBuilder()
            .setTitle("An error occurred")
            .setDescription(`\`${error.message}\``)
            .setColor("Red")
            .setTimestamp()
            .setFooter(
              `Requested by ${interaction.user.tag}`,
              interaction.user.displayAvatarURL()
            ),
        });
      } else {
        await interaction.reply({
          embed: new EmbedBuilder()
            .setTitle("An error occurred")
            .setDescription(`\`${error.message}\``)
            .setColor("Red")
            .setTimestamp()
            .setFooter(
              `Requested by ${interaction.user.tag}`,
              interaction.user.displayAvatarURL()
            ),
          ephemeral: true,
        });
      }
    }
  },
};
