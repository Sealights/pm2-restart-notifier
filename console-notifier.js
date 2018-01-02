function ConsoleNotifier() {
    this.notify = function(processData, lastErrors, lastLogs){
        console.log('** RESTART DETECTED ON '+processData.name+' (total '+processData.restart_time+' restarts)');
			if (lastErrors.length){
				console.log('Last errors:', lastErrors);
			}
			else {
				console.log('Error log not available');
			}

			if (lastLogs.length){
				console.log('Last log lines:', lastLogs);
			}
			else {
				console.log('Log data not available');
			}
    }
};


module.exports = function(){ return new ConsoleNotifier()};
