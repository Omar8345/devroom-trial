const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getxp")
    .setDescription("Returns amount of XP a User has.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get count of XP.")
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

      const userXp = await db.getXP(user.id);
      const level = Math.floor(userXp / 100);
      const xpForNextLevel = (level + 1) * 100;
      const progress = Math.min((userXp / xpForNextLevel) * 100, 100);
      console.log(
        `User: ${user.tag} | XP: ${userXp} | Level: ${level} | Progress: ${progress}`
      );
      const embed = new EmbedBuilder()
        .setTitle(`${member.user.tag}'s XP`)
        .setColor("Blue")
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          {
            name: "Username",
            value: member.user.tag,
            inline: true,
          },
          {
            name: "XP",
            value: `__**${userXp}**__`,
            inline: true,
          },
          {
            name: "Level",
            value: `__**${level}**__`,
            inline: true,
          },
          {
            name: "Progress to Next Level",
            value: `${progress.toFixed(2)}%`,
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
      console.error("Error fetching XP:", error);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription("An error occurred while fetching the XP.")
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
