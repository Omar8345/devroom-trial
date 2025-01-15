const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to kick.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for kicking the user.")
        .setRequired(false)
    ),

  async execute(interaction) {
    const hasPermission = interaction.member.permissions.has("KICK_MEMBERS");
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

    if (targetUser.id === interaction.user.id) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You cannot kick yourself.")
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

    if (
      targetMember.roles.highest.position >=
      interaction.member.roles.highest.position
    ) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Role Hierarchy Error")
            .setDescription(
              "You cannot kick this user because their role is equal to or higher than yours."
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

    if (!interaction.guild.members.me.permissions.has("KICK_MEMBERS")) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(
              "I do not have the required permission to kick members."
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

    const reason =
      interaction.options.getString("reason") || "No reason provided.";

    try {
      await targetMember.kick(reason);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("User Kicked")
            .setDescription(
              `Successfully kicked <@${targetMember.id}> from the server.`
            )
            .addFields({
              name: "Reason",
              value: reason ?? "No reason provided.",
            })
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
              .setTitle("User Kicked")
              .setDescription(
                `**${interaction.user.tag}** kicked <@${targetMember.id}> from the server.`
              )
              .addFields(
                {
                  name: "Moderator",
                  value: interaction.user.tag,
                  inline: true,
                },
                { name: "User", value: `<@${targetMember.id}>`, inline: true },
                { name: "Reason", value: reason ?? "No reason provided." }
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
      console.error("Error kicking user:", error);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error Kicking User")
            .setDescription("There was an error kicking the user.")
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
