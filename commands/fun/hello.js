const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Sends a personalized greeting with a fun fact."),
  async execute(interaction) {
    const lastActive = await db.getLastActiveTime(interaction.user.id);
    const funFacts = await db.getFunFacts();
    const randomFact = funFacts.length
      ? funFacts[Math.floor(Math.random() * funFacts.length)]
      : "No fun facts available at the moment!";

    const embed = new EmbedBuilder()
      .setTitle(`Hello, ${interaction.member.displayName}! 👋`)
      .setFields([
        {
          name: "Last Active",
          value: lastActive ? `<t:${lastActive}:f>` : "Unknown",
          inline: true,
        },
        {
          name: "Fun Fact",
          value: `> ${randomFact}`,
          inline: true,
        },
      ])
      .setColor("Green")
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.reply({ embeds: [embed] });
  },
};
