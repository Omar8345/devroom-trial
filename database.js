const mysql = require("mysql2/promise");
const config = require("./config.json");

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

module.exports = {
  async getLastActiveTime(userId) {
    const [rows] = await pool.query(
      "SELECT last_active FROM users WHERE id = ?",
      [userId]
    );
    if (rows.length && rows[0].last_active) {
      return rows[0].last_active;
    }
    return null;
  },

  async getFunFacts() {
    const [rows] = await pool.query("SELECT fact FROM fun_facts");
    return rows.map((row) => row.fact);
  },

  async addXP(userId, xp) {
    await pool.query("UPDATE users SET xp = xp + ? WHERE id = ?", [xp, userId]);
  },

  async updateUserLastActive(userId, timestamp) {
    const unixTimestamp = Math.floor(timestamp);
    await pool.query("UPDATE users SET last_active = ? WHERE id = ?", [
      unixTimestamp,
      userId,
    ]);
  },

  async updateMessageCount(userId, messageCount) {
    await pool.query("UPDATE users SET message_count = ? WHERE id = ?", [
      messageCount,
      userId,
    ]);
  },

  async getUserMessageCount(userId) {
    const [rows] = await pool.query(
      "SELECT message_count FROM users WHERE id = ?",
      [userId]
    );
    return rows.length ? rows[0].message_count : 0;
  },

  async getUser(userId) {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    return rows.length ? rows[0] : null;
  },

  async addUser(userId, username) {
    await pool.query(
      "INSERT INTO users (id, username, message_count, last_active) VALUES (?, ?, ?, ?)",
      [userId, username, 0, null]
    );
  },
};
