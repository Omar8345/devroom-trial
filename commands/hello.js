const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Hello there!"),
  async execute(interaction, client) {
    await interaction.reply(`To be implemented...`);
  },
};
