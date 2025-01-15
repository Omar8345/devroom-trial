const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a user for a specified duration.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to mute.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration of the mute in minutes.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for muting the user.")
        .setRequired(false)
    ),

  async execute(interaction) {
    const hasPermission =
      interaction.member.permissions.has("MODERATE_MEMBERS");
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
    const durationMinutes = interaction.options.getInteger("duration");
    const reason =
      interaction.options.getString("reason") || "No reason provided.";

    if (durationMinutes <= 0) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Invalid Duration")
            .setDescription(
              "Please provide a valid duration greater than 0 minutes."
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

    if (targetMember.communicationDisabledUntil) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("User Already Muted")
            .setDescription(`<@${targetMember.id}> is already muted.`)
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

    if (!interaction.guild.members.me.permissions.has("MODERATE_MEMBERS")) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(
              "I do not have the required permission to mute members."
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

    const durationMs = durationMinutes * 60 * 1000;

    try {
      await targetMember.timeout(durationMs, reason);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("User Muted")
            .setDescription(
              `Successfully muted <@${targetMember.id}> for ${durationMinutes} minutes.`
            )
            .addFields({ name: "Reason", value: reason })
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
              .setTitle("User Muted")
              .setDescription(
                `<@${interaction.user.id}> muted <@${targetMember.id}> for ${durationMinutes} minutes.`
              )
              .addFields(
                { name: "Reason", value: reason },
                { name: "Duration", value: `${durationMinutes} minutes` }
              )
              .setColor("Yellow")
              .setTimestamp()
              .setFooter({
                text: `Muted by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
              }),
          ],
        });
      }
    } catch (error) {
      console.error("Error muting user:", error);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error Muting User")
            .setDescription("There was an error muting the user.")
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
