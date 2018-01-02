const pmx = require('pmx');
const pm2 = require('pm2');
const readLastLines = require('read-last-lines');
const os = require('os');

var conf = pmx.initModule({});
var notifiers = [];

if (conf.errorLines == null) conf.errorLines == 50;
if (conf.logLines == null) conf.logLines == 50;
if (conf.pollInterval == null || conf.pollInterval<1000) conf.pollInterval = 30*1000; //Default poll every 30sec
const defaultInterval = 60 * 1000; //Minimal time between notifications = 1 minute.
var messagePrefix = conf.prefix || os.hostname();
if (conf.pagerdutyServiceKey)
	notifiers.push(require('./pager-duty-notifier')(conf.pagerdutyServiceKey, conf.pagerdutyNotificationInterval || defaultInterval, messagePrefix));
if (conf.slackToken)
	notifiers.push(require('./slack-notifier')(conf.slackToken, conf.slackNotificationInterval || defaultInterval, messagePrefix, conf.slackEmoji));
if (!notifiers.length || conf.consoleNotifier)
	notifiers.push(require('./console-notifier')());

var pidStats = {};

pm2.connect(true, function (err) {
	if (err) {
		console.log('Error connecting to pm2: ' + err);
	}
	else {
		setInterval(function () {
			pm2.list(function (err, processDescriptionList) {
				if (err) {
					console.log('Error getting process list from pm2: ' + err);
				} else {
					var now = new Date();
					processDescriptionList.forEach(function (p) {
						var pm2Id = p.pm2_env.pm_id;
						console.log('pm2Id='+pm2Id);
						if (p.name == 'pm2-restart-notifier') return; //exclude self
						if (!pidStats[pm2Id]) {
							console.log('Starting to monitor ' + p.name);
							pidStats[pm2Id] = {
								name: p.name,
								pid: p.pid,
								pm2Id: pm2Id,
								last_update: now,
								status: p.pm2_env.status,
								restart_time: p.pm2_env.restart_time || 0,
								pm_uptime: p.pm2_env.pm_uptime,
								pm_out_log_path: p.pm2_env.pm_out_log_path,
								pm_err_log_path: p.pm2_env.pm_err_log_path
							}
						} else {
							pidStats[pm2Id].last_update = now;
							if (pidStats[pm2Id].restart_time != p.pm2_env.restart_time) {
								pidStats[pm2Id].restart_time = p.pm2_env.restart_time;								
								alertRestarts(pidStats[pm2Id]);
							}
						}
					});
				}
			});
		}, conf.pollInterval);
	}
});

function alertRestarts(processData) {	
	var lastErrors = null, lastLogs = null;

	function tryFinalize() {
		if (lastErrors != null && lastLogs != null) {
			notifiers.forEach(function (notifier) {
				try {
					if (notifier.isDisabled) {
						// Notifier disabled, see cause below
						return;
					}					
					notifier.notify(processData, lastErrors, lastLogs);
				} catch (e) {
					console.error("Notifier crashed and will now be disabled: " + e);
					notifier.isDisabled = true;
				}
			})
		}
	}

	if (conf.errorLines == 0) {
		lastErrors = [];
	} else {
		readLastLines.read(processData.pm_err_log_path, conf.errorLines)
			.then(function (lines) {
				lastErrors = lines ? lines.split('\n') : [];
				tryFinalize();
			}).catch(function (err) {
				lastErrors = [];
				tryFinalize();
			});
	}
	if (conf.logLines == 0) {
		lastLogs = [];
	} else {
		readLastLines.read(processData.pm_out_log_path, conf.logLines)
			.then(function (lines) {
				lastLogs = lines ? lines.split('\n') : [];
				tryFinalize();
			}).catch(function (err) {
				lastLogs = [];
				tryFinalize();
			});
	}
	tryFinalize();
}