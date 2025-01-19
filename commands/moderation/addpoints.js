const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addpoints")
    .setDescription("Grant points to a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to grant points to.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("points")
        .setDescription("The amount of points to grant.")
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

    const targetUser = interaction.options.getUser("user");
    const pointsToAdd = interaction.options.getInteger("points");

    if (targetUser.id === interaction.user.id) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You cannot grant points to yourself.")
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

    if (pointsToAdd <= 0) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Invalid points Amount")
            .setDescription(
              "The amount of points to grant must be greater than 0."
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

    const userHighestRole = interaction.member.roles.cache
      .filter((role) => config.modRoleIds.includes(role.id))
      .sort(
        (a, b) =>
          config.modRoleIds.indexOf(a.id) - config.modRoleIds.indexOf(b.id)
      )
      .first();

    const targetHighestRole =
      targetMember.roles.cache
        .filter((role) => config.modRoleIds.includes(role.id))
        .sort(
          (a, b) =>
            config.modRoleIds.indexOf(a.id) - config.modRoleIds.indexOf(b.id)
        )
        .first() || null;

    if (targetHighestRole) {
      const userRoleIndex = config.modRoleIds.indexOf(userHighestRole.id);
      const targetRoleIndex = config.modRoleIds.indexOf(targetHighestRole.id);

      if (userRoleIndex >= targetRoleIndex) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Role Hierarchy Error")
              .setDescription(
                "You cannot add points to this user because their moderation role is the same or higher than yours in the hierarchy."
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
    }

    try {
      const userData = await db.getUser(targetUser.id);
      if (!userData) {
        await db.addUser(targetUser.id, targetUser.username);
      }

      await db.addPoints(targetUser.id, pointsToAdd);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Points Granted")
            .setDescription(
              `Successfully added **${pointsToAdd} points** to <@${targetUser.id}>.`
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
              .setTitle("Points Granted")
              .setDescription(
                `**${interaction.user.tag}** added **${pointsToAdd} Points** to <@${targetUser.id}>.`
              )
              .addFields(
                {
                  name: "Moderator",
                  value: interaction.user.tag,
                  inline: true,
                },
                { name: "User", value: `<@${targetUser.id}>`, inline: true },
                { name: "Points Added", value: `${pointsToAdd}`, inline: true }
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
      console.error("Error adding Points:", error);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error Adding Points")
            .setDescription(
              "An error occurred while trying to grant points to the user."
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
