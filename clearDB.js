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

async function clearTables() {
  const tablesToClear = ["users", "fun_facts", "welcome_messages"];

  try {
    const connection = await pool.getConnection();

    // Disable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // Truncate each specified table
    for (const table of tablesToClear) {
      await connection.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`Cleared table: ${table}`);
    }

    // Re-enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("All specified tables cleared successfully.");
    connection.release();
  } catch (error) {
    console.error("Error clearing tables:", error);
  } finally {
    pool.end();
  }
}

clearTables();
