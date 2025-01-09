const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("assignrole")
    .setDescription("Assign a role to a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to add the role to.")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to add.")
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

    if (interaction.options.getUser("user").id === interaction.user.id) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You cannot add a role to yourself.")
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
      .fetch(interaction.options.getUser("user").id)
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
                "You cannot add a role to this user because their moderation role is the same or higher than yours in the hierarchy."
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

    if (
      !interaction.guild.members.me.permissions.has(
        BigInt("0x0000000010000000")
      )
    ) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(
              "I do not have the required permission to manage roles."
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

    const role = interaction.options.getRole("role");

    if (
      interaction.guild.members.me.roles.highest.comparePositionTo(role) <= 0
    ) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Role Hierarchy Error")
            .setDescription(
              "I cannot add this role because it is higher or equal to my highest role."
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

    if (targetMember.roles.cache.has(role.id)) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Role Already Assigned")
            .setDescription(
              `<@${targetMember.id}> already has the role <@&${role.id}>.`
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
      await targetMember.roles.add(role);
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Role Has Been Assigned")
            .setDescription(
              `Successfully added the role <@&${role.id}> to <@${targetMember.id}>.`
            )
            .setColor("Green")
            .setTimestamp()
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            }),
        ],
      });
    } catch (error) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error Adding Role")
            .setDescription("There was an error adding the role to the user.")
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
