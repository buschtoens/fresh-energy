const mysql = require('mysql2/promise');

module.exports = class Database {
  constructor({ userId = null } = {}) {
    this.userId = userId;
  }

  async connect(options) {
    this.connection = await mysql.createConnection(options);
  }

  async getLastReadingDate() {
    const [[{ date }]] = await this.connection.execute(`
      select max(dateTime) as date from readings
      where userId = ?
    `, [this.userId]);

    return date;
  }

  async writeReadings(readings) {
    const values = readings.map((r) => [
      this.userId,
      r.dateTime,
      r.power,
      r.powerPhase1,
      r.powerPhase2,
      r.powerPhase3,
      r.energyReading
    ]);
    await this.connection.query(`
      insert ignore into readings
      (userId, dateTime, power, powerPhase1, powerPhase2, powerPhase3, energyReading)
      VALUES ?
    `, [values]);
  }
};
