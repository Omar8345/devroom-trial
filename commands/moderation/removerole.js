const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("removerole")
    .setDescription("Removes a role from a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove the role from.")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to remove.")
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
            .setDescription("You cannot remove a role from yourself.")
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
                "You cannot remove a role from this user because their moderation role is the same or higher than yours in the hierarchy."
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
              "I cannot remove this role because it is higher or equal to my highest role."
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

    if (!targetMember.roles.cache.has(role.id)) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Role Not Found")
            .setDescription(
              `<@&${role.id}> is not assigned to <@${targetMember.id}>.`
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

    return await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Are you sure?")
          .setDescription(
            `Are you sure you want to remove the role <@&${role.id}> from <@${targetMember.id}>?`
          )
          .setColor("Green")
          .setTimestamp()
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          }),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(
              `rm_role_${interaction.user.id}_${targetMember.user.id}_${role.id}`
            )
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success)
            .setEmoji("✅"),
          new ButtonBuilder()
            .setCustomId(`rm_role_cancel_${interaction.user.id}`)
            .setLabel("No")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("❌")
        ),
      ],
    });
  },
};
