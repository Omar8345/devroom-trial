const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database");

module.exports = {
  category: "utility",
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Displays detailed information about a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get information about.")
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

    let userData;
    try {
      userData = await db.getUser(user.id);

      if (!userData) {
        await db.addUser(user.id, user.username);
        userData = {
          id: user.id,
          username: user.username,
          message_count: 0,
          xp: 0,
        };
      }

      const xp = userData.xp;
      const level = Math.floor(xp / 100); // Each level requires 100 XPs
      const xpForNextLevel = (level + 1) * 100;
      const progress = Math.min((xp / xpForNextLevel) * 100, 100);

      const embed = new EmbedBuilder()
        .setTitle(`${member.user.tag}'s Info`)
        .setColor("Blue")
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          {
            name: "Username",
            value: `**\`${member.user.username}\`**`,
            inline: true,
          },
          { name: "User ID", value: `**\`${member.user.id}\`**`, inline: true },
          {
            name: "Joined Server",
            value: `**<t:${Math.floor(member.joinedTimestamp / 1000)}:F>**`,
            inline: true,
          },
          {
            name: "Roles",
            value:
              member.roles.cache.size > 1
                ? member.roles.cache
                    .filter((role) => role.name !== "@everyone")
                    .map((role) => `- **\`${role.name}\`**`)
                    .join("\n")
                : "No roles",
            inline: true,
          },
          { name: "Bot", value: member.user.bot ? "Yes" : "No", inline: true },
          {
            name: "Total Messages",
            value: `__**${userData.message_count}**__`,
            inline: true,
          },
          { name: "XP", value: `**__${xp}__**`, inline: true },
          { name: "Level", value: `**__${level}__**`, inline: true },
          {
            name: "Progress to Next Level",
            value: `**__${progress.toFixed(2)}%__**`,
            inline: true,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching user data:", error);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error Fetching User Info")
            .setDescription(
              "An error occurred while retrieving the user's data."
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
