const mysql = require("mysql2/promise");
const config = require("./config.json");

async function insertFunFacts() {
  const funFacts = [
    "Discord was launched on May 13, 2015, as a communication platform for gamers.",
    "The name 'Discord' was chosen to represent solving the communication problems in gaming.",
    "Discord has over 150 million monthly active users worldwide.",
    "Discord Has a Record of 8.2 Million Peak Concurrent Users.",
    "Discord Is the Favorite Social Media Platform for 3% of US Teenagers.",
    "The Fortnite Server Was the Largest Discord Server before Being Beaten by the Midjourney Discord Server with 21 Million Members.",
    "Discord Rejected a $12 Billion Purchase Offer From Microsoft.",
    "The character on Discord's 404 page is named Nelly.",
    "Discord was almost named Wyvern. Dodged a bullet there, whew.",
    "Discord came up with the idea of Discord Nitro over morning breakfast potatoes.",
  ];

  try {
    const connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      port: config.database.port,
    });

    await connection.query(`
      CREATE TABLE IF NOT EXISTS fun_facts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fact TEXT NOT NULL
      )
    `);

    for (const fact of funFacts) {
      await connection.query("INSERT INTO fun_facts (fact) VALUES (?)", [fact]);
    }

    console.log("Fun facts have been successfully added to the database.");
    await connection.end();
  } catch (error) {
    console.error("Error inserting fun facts:", error);
  }
}

insertFunFacts();
