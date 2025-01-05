const { Events, Message } = require("discord.js");
const database = require("../database");

module.exports = {
  name: Events.MessageCreate,
  /**
   * @param {Message} message
   */
  async execute(message) {
    if (message.author.bot) return;
    if (message.interactionMetadata) return;

    const userId = message.author.id;

    try {
      let user = await database.getUser(userId);

      if (!user) {
        await database.addUser(userId, message.author.username);
        user = {
          id: userId,
          username: message.author.username,
          message_count: 0,
        };
      }

      await database.updateUserLastActive(
        userId,
        Math.round(message.createdTimestamp / 1000)
      );

      const newMessageCount = user.message_count + 1;
      await database.updateMessageCount(userId, newMessageCount);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  },
};
