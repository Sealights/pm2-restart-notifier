# pm2-restart-notifier
This pm2 module sends notifications in various channels on the occasion of service restarts.

# Installation
`pm2 install pm2-restart-notifier`

# Configuration:
`pm2 set pm2-restart-notifier:[KEY] [VALUE]`

e.g.

`pm2 set pm2-restart-notifier:errorLines 50`

* errorLines - number of error lines to include in the alert (default is 50 lines)
* logLines - number of log lines to include in the alert (default is 50 lines)
* pollInterval - number of ms between pm2 polling operations (default is 30 sec)
* prefix - A prefix to show on every message (default is the host name)

## Pager Duty settings
* pagerdutyServiceKey - pager duty service key (required in order to turn on the pagerDuty notifier)
* pagerdutyNotificationInterval - minimal interval between alerts for the same service (default to 60 seconds)

## Slack settings
* slackToken - slack webhook token, in the form of xxxxxxxxx/xxxxxxxxx/xxxxxxxxxxxxxxxxxxxxxxxx (required in order to turn on the slack notifier)
* slackNotificationInterval - minimal interval between alerts for the same service (default to 60 seconds)
* slackEmoji - an emoji to show on slack alerts (default to :boom:)
