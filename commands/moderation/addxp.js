const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database");

module.exports = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("addxp")
    .setDescription("Grant experience points (XP) to a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to grant XP to.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("xp")
        .setDescription("The amount of XP to grant.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const hasPermission = interaction.member.permissions.has("MANAGE_GUILD");
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

    const targetUser = interaction.options.getUser("user");
    const xpToAdd = interaction.options.getInteger("xp");

    if (targetUser.id === interaction.user.id) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You cannot grant XP to yourself.")
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

    const targetMember = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    if (!targetMember) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              "The target user is not in the server or could not be found."
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

    if (xpToAdd <= 0) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Invalid XP Amount")
            .setDescription("The amount of XP to grant must be greater than 0.")
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

    if (
      targetMember.roles.highest.position >=
      interaction.member.roles.highest.position
    ) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Role Hierarchy Error")
            .setDescription(
              "You cannot grant XP to this user because their role is equal to or higher than yours."
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

    try {
      const userData = await db.getUser(targetUser.id);
      if (!userData) {
        await db.addUser(targetUser.id, targetUser.username);
      }

      await db.addXP(targetUser.id, xpToAdd);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("XP Granted")
            .setDescription(
              `Successfully added **${xpToAdd} XP** to <@${targetUser.id}>.`
            )
            .setColor("Green")
            .setTimestamp()
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            }),
        ],
      });

      const logsChannel = interaction.guild.channels.cache.get(
        config.logsChannelId
      );
      if (logsChannel) {
        logsChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("XP Granted")
              .setDescription(
                `**${interaction.user.tag}** added **${xpToAdd} XP** to <@${targetUser.id}>.`
              )
              .addFields(
                {
                  name: "Moderator",
                  value: interaction.user.tag,
                  inline: true,
                },
                { name: "User", value: `<@${targetUser.id}>`, inline: true },
                { name: "XP Added", value: `${xpToAdd}`, inline: true }
              )
              .setColor("Green")
              .setTimestamp()
              .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
              }),
          ],
        });
      }
    } catch (error) {
      console.error("Error adding XP:", error);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error Adding XP")
            .setDescription(
              "An error occurred while trying to grant XP to the user."
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
