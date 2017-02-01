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
    for (let r of readings) {
      console.log(r.dateTime);
      await this.connection.query('insert ignore into readings set ?', {
        userId: this.userId,
        dateTime: r.dateTime,
        power: r.power,
        powerPhase1: r.powerPhase1,
        powerPhase2: r.powerPhase2,
        powerPhase3: r.powerPhase3,
        energyReading: r.energyReading
      });
    }
  }
};
