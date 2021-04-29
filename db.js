const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database("./files.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to database.");
});
db.serialize(function () {
  db.run(
    "CREATE TABLE IF NOT EXISTS files (channel TEXT NOT NULL, name TEXT NOT NULL, url TEXT NOT NULL )"
  );
});

const saveFile = (channel, name, url) => {
  return new Promise(async (resolve, reject) => {
    if (!channel || !name || !url) {
      reject("Invalid parameters");
      return;
    }
    const file = await getFile(channel, name);
    if (file) {
      db.run(
        "UPDATE files SET url=? WHERE channel=? and name=?",
        [url, channel, name],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          console.log("rows", rows);
          resolve(rows && rows.length > 0);
        }
      );
    } else {
      db.run(
        "INSERT INTO files(channel, name, url) VALUES(?,?,?)",
        [channel, name, url],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows && rows.length > 0);
        }
      );
    }
  });
};
const getFile = (channel, name) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT url FROM files where channel=$channel and name=$name",
      {
        $channel: channel,
        $name: name,
      },
      (error, rows) => {
        if (error) {
          reject(error);
        } else {
          if (rows.length > 0) {
            resolve(rows[0].url);
          } else {
            resolve();
          }
        }
      }
    );
  });
};
const getAll = (channel) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT name, url FROM files where channel=$channel",
      {
        $channel: channel
      },
      (error, rows) => {
        if (error) {
          reject(error);
        } else {
          if (rows.length > 0) {
            resolve(rows.map(row => ({name: row.name, url: row.url})));
          } else {
            resolve();
          }
        }
      }
    );
  });
};
// Test
// (async () => {
//     try {
//         const saved = await saveFile("testChannel", "daily", "goolasdase.com");
//         console.log("saved", saved);
//         const file = await getFile("testChannel", "daily");
//         console.log("file", file);
//     } catch (e) {
//         console.log('error', e);
//     }
// })();

module.exports = { saveFile, getFile, getAll };
