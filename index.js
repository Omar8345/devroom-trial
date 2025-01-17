const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} = require("discord.js");
const mysql = require("mysql2/promise");
const config = require("./config.json");
const fs = require("fs");
const path = require("path");

const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  port: config.database.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
  ],
});

client.commands = new Collection();

const foldersPath = path.resolve(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);
let cmdArray = [];

for (const folder of commandFolders) {
  const commandsPath = path.resolve(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.resolve(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      if (!client.commands.has(command.data.name)) {
        client.commands.set(command.data.name, command);
        cmdArray.push(command.data.toJSON());
      }
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const uniqueCmdArray = Array.from(
  new Map(cmdArray.map((cmd) => [cmd.name, cmd])).values()
);

const eventsPath = path.resolve(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.resolve(eventsPath, file);
  const event = require(filePath);

  try {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  } catch (error) {
    console.error(`Error executing event ${event.name}:`, error);
  }
}

const rest = new REST({ version: "10" }).setToken(config["token"]);

async function checkAndCreateTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255),
      last_active BIGINT DEFAULT 0,
      message_count INT DEFAULT 0,
      xp INT DEFAULT 0,
      points INT DEFAULT 0
    )
  `;

  const createFunFactsTable = `
    CREATE TABLE IF NOT EXISTS fun_facts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fact TEXT NOT NULL
    )
  `;

  const createWelcomeMessagesTable = `
    CREATE TABLE IF NOT EXISTS welcome_messages (
      guild_id VARCHAR(255) PRIMARY KEY,
      message TEXT NOT NULL
    )
  `;

  try {
    await pool.query(createUsersTable);
    console.log("Users table checked/created successfully.");

    await pool.query(createFunFactsTable);
    console.log("Fun facts table checked/created successfully.");

    await pool.query(createWelcomeMessagesTable);
    console.log("Welcome messages table checked/created successfully.");
  } catch (error) {
    console.error("Error checking/creating tables:", error);
  }
}

async function clearGuildCommands() {
  try {
    console.log("Clearing existing guild commands...");
    await rest.put(
      Routes.applicationGuildCommands(config["clientId"], config["guildId"]),
      {
        body: [],
      }
    );
    console.log("Successfully cleared guild commands.");
  } catch (error) {
    console.error("Error clearing guild commands:", error);
  }
}

async function registerCommands() {
  try {
    console.log(
      `Starting to refresh ${uniqueCmdArray.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationGuildCommands(config["clientId"], config["guildId"]),
      {
        body: uniqueCmdArray,
      }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error("Error reloading commands:", error);
  }
}

async function initializeBot() {
  try {
    await checkAndCreateTables();

    await clearGuildCommands();
    await registerCommands();

    await client.login(config["token"]);
  } catch (error) {
    console.error("Error during the bot initialization:", error);
  }
}

initializeBot();
