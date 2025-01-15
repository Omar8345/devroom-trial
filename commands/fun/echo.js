const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Echoes your input message.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to echo.")
        .setRequired(true)
        .setMaxLength(500)
    ),
  async execute(interaction) {
    const inputMessage = interaction.options.getString("message");
    const reversedMessage = inputMessage.split("").reverse().join("");

    const embed = new EmbedBuilder()
      .setTitle("Echo")
      .setFields([
        {
          name: "Original",
          value: `\`\`\`${inputMessage}\`\`\``,
        },
        {
          name: "Output",
          value: `\`\`\`${reversedMessage}\`\`\``,
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
