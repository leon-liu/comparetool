const schedule = require("node-schedule");
const { login, getBook, updateCache } = require("./api");

const run = async () => {
  const token = await login();
  // await resetGetBook(token, 1);
  // return
  let hasMore = true;
  while (hasMore) {
    hasMore = await getBook(token);
  }
  await updateCache(token);
};

// run at 1am every day
schedule.scheduleJob({ hour: 1 }, function () {
  run();
});

run();
