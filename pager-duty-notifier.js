const PagerDuty = require('pagerduty');

function PagerDutyNotifier(pagerdutyServiceKey, interval, prefix) {
    if (!pagerdutyServiceKey) throw new Error("pagerdutyServiceKey is required");
    interval = interval || 60 * 1000; //Once every mintue
    prefix = prefix || "";

    var lastNotifications = {};

    const pager = new PagerDuty({
        serviceKey: pagerdutyServiceKey
      });
    var _this = this;
    this.notify = function notify(processData, lastErrors, lastLogs) {

        var now = new Date();
        var lastNotification = lastNotifications[processData.name];
        if (lastNotification != null && lastNotification + interval > now) {
            return;
        }
        lastNotifications[processData.name] = now;

        var text = prefix + " " + processData.name + " restarted (total " + processData.unstable_restarts + " restarts until now)";
        pager.create({
            description: text, // required 
            details: {
              process: processData.name,
              restarts: processData.unstable_restarts,
              lastErrors:lastErrors,
              lastLogs:lastLogs
            }
        });
    }
}

module.exports = function (pagerdutyServiceKey, interval, prefix) { return new PagerDutyNotifier(pagerdutyServiceKey, interval, prefix); }