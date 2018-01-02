const https = require('https');

function SlackNotifier(slackToken, interval, prefix, icon_emoji) {
    if (!slackToken) throw new Error("slackToken is required");
    interval = interval || 60 * 1000; //Once every mintue
    prefix = prefix || "";
    icon_emoji = icon_emoji || ":boom:";
    var lastNotifications = {};    

    this.notify = function notify(processData, lastErrors, lastLogs) {
        var now = new Date();
        var lastNotification = lastNotifications[processData.name];
        if (lastNotification != null && lastNotification.valueOf() + interval > now.valueOf()) {
            return;
        }
        lastNotifications[processData.name] = now;

        var text = prefix + " " + processData.name + " restarted (total " + processData.restart_time + " restarts until now)";
        
        var content = {
            "fields": [
                {
                    "title": "Service",
                    "value": processData.name,
                    "short": true
                },
                {
                    "title": "Total restarts",
                    "value": processData.restart_time,
                    "short": true
                }
            ],
            "text": text,
            "attachments": [{
                "title": text
            }],
            "icon_emoji": icon_emoji
        }
        if (lastErrors && lastErrors.length > 0) {
            content.attachments.push({
                "title": "stderr tail",
                "color": "danger",
                "fallback": lastErrors[lastErrors.length - 1],
                "text": lastErrors.join('\n')
            })
        }

        if (lastLogs && lastLogs.length > 0) {
            content.attachments.push({
                "title": "stdout tail",
                "color": "warning",
                "fallback": lastLogs[lastLogs.length - 1],
                "text": lastLogs.join('\n')
            })
        }

        var post_data = JSON.stringify(content);
        var post_options = {
            host: 'hooks.slack.com',
            port: '443',
            path: '/services/' + slackToken,
            method: 'POST',
            headers: {
                'Content-Type': 'application/javascript',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };

        var post_req = https.request(post_options, function (res) {
            // res.setEncoding('utf8');
            // res.on('data', function (chunk) {
            //     console.log('Response: ' + chunk);
            // });
        });

        // post the data
        post_req.write(post_data);
        post_req.end();
    }
}

module.exports = function (slackToken, interval, prefix, icon_emoji) { return new SlackNotifier(slackToken, interval, prefix, icon_emoji); }