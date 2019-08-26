const Schedule = require('node-schedule');

var cron = {};

cron.schedule = (time, func) => {
  Schedule.scheduleJob(time, func);
}

module.exports = cron;