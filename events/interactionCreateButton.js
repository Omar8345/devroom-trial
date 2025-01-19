const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    if (
      interaction.customId.startsWith("rm_role_") &&
      !interaction.customId.startsWith("rm_role_cancel_")
    ) {
      const interactionData = interaction.customId.split("_");
      const interactionUserId = interactionData[2];
      const targetUserId = interactionData[3];
      const roleId = interactionData[4];

      if (interactionUserId !== interaction.user.id) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription("This button is not for you.")
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

      await interaction.deferUpdate();

      const member = await interaction.guild.members.fetch(targetUserId);
      const role = interaction.guild.roles.cache.get(roleId);

      if (!member) {
        return await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription("The user is not in this server.")
              .setColor("Red")
              .setTimestamp()
              .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
              }),
          ],
          components: [],
        });
      }

      try {
        await member.roles.remove(role);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Role Removed")
              .setDescription(
                `Successfully removed the role <@&${role.id}> from <@${member.id}>.`
              )
              .setColor("Green")
              .setTimestamp()
              .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
              }),
          ],
          components: [],
        });
      } catch (error) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription(`An error occurred: \`${error.message}\``)
              .setColor("Red")
              .setTimestamp()
              .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
              }),
          ],
          components: [],
        });
      }
    }

    if (interaction.customId.startsWith("rm_role_cancel_")) {
      const interactionData = interaction.customId.split("_");
      const interactionUserId = interactionData[3];

      if (interactionUserId !== interaction.user.id) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription("This button is not for you.")
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

      await interaction.deferUpdate();

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Operation canceled")
            .setDescription("The operation has been canceled.")
            .setColor("Red")
            .setTimestamp()
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            }),
        ],
        components: [],
      });
    }
  },
};
