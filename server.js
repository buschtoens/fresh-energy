require('dotenv').config();
const Api = require('./lib/api');
const Database = require('./lib/database');

process.on('unhandledRejection', (error) => {
  if (error.statusCode) {
    console.log({
      statusCode: error.statusCode,
      options: error.options
    });
  } else {
    console.error(error);
  }
});

function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

async function connectApi() {
  const api = new Api();

  const {
    FRESH_USERNAME: username,
    FRESH_PASSWORD: password,
    FRESH_TOKEN: token
  } = process.env;

  if (username && password) {
    await api.login({ username, password });
  } else if (token) {
    await api.login({ token });
  }

  await api.initialize();

  return api;
}

async function connectDatabase() {
  const db = new Database();

  const {
    MYSQL_HOST: host,
    MYSQL_PORT: port = 3306,
    MYSQL_USER: user,
    MYSQL_PASSWORD: password,
    MYSQL_DATABASE: database
  } = process.env;

  await db.connect({ host, port, user, password, database });

  return db;
}

async function getMeterInstalledDate(api) {
  const { meterInstalledAt } = await api.requestLink('registrationStatus');
  const meterInstalledDate = new Date(meterInstalledAt);
  meterInstalledDate.setHours(meterInstalledDate.getHours() - 1);
  return meterInstalledDate;
}

(async () => {
  const [api, db] = await Promise.all([connectApi(), connectDatabase()]);

  db.userId = api.userId;

  const [dbLastDate, meterInstalledDate] = await Promise.all([
    db.getLastReadingDate(),
    getMeterInstalledDate(api)
  ]);

  let nextDate = dbLastDate || meterInstalledDate;

  while (true) {
    const { readings, next } = await api.loadReadings(nextDate);
    await db.writeReadings(readings);
    console.log({
      length: readings.length,
      current: nextDate,
      next
    });
    if (next) {
      nextDate = next;
    }
    if (readings.length < 60 * 30) {
      await wait(5000);
    }
  }

  // for (let key of Object.keys(api.links)) {
  //   try {
  //     const response = await api.requestLink(key);
  //     console.log({ key, response });
  //   } catch (e) {
  //     console.log({ key, error: e.statusCode });
  //   }
  // }
})();
