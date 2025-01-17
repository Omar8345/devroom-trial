const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getpoints")
    .setDescription("Returns amount of points a User has.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get count of points.")
        .setRequired(false)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("User Not Found")
            .setDescription("The specified user is not in this server.")
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

    try {
      if (!db.getUser(user.id)) {
        await db.addUser(user.id, user.username);
      }

      const userPoints = await db.getPoints(user.id);
      const embed = new EmbedBuilder()
        .setTitle(`${member.user.tag}'s Points`)
        .setColor("Blue")
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          {
            name: "Username",
            value: member.user.tag,
            inline: true,
          },
          {
            name: "Points",
            value: `__**${userPoints}**__`,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching points:", error);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription("An error occurred while fetching the points.")
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
