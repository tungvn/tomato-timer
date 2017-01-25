'use strict';

var vscode = require('vscode');

function activate(context) {
    // Get settings
    var settings = vscode.workspace.getConfiguration().get("tomatoTimer");
    var shortToLongTime = settings.shortBreakToLongBreakTime;

    // Define status bar item for tomato timer
    let statusBarItem = new TomatoTimerBarItem("", 0, shortToLongTime);
    context.subscriptions.push(statusBarItem);

    // Action create new Pomodoro
    let timerStart = vscode.commands.registerCommand('timer.start', function () {
        vscode.window
            .showQuickPick(['10 minutes', '20 minutes', '25 minutes', '45 minutes', '60 minutes'])
            .then(function (time) {
                if (typeof time == 'undefined') {
                    return false;
                }

                let timePomo = parseInt(time);
                vscode.window.showInformationMessage('Pomodoro start with '+time+'!');
                statusBarItem = new TomatoTimerBarItem("pomodoro", timePomo*60, shortToLongTime);
            });
        
    });
    context.subscriptions.push(timerStart);

    // Action cancel exists Pomodoro
    let timerStop = vscode.commands.registerCommand('timer.cancel', function () {
        vscode.window.showWarningMessage('Pomodoro stopped!');
        statusBarItem.dispose();
    });
    context.subscriptions.push(timerStop);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;

class TomatoTimerBarItem {
    constructor(status, time, shortToLongTime) {
        this._tomatoTimer = new TomatoTimer(status, time, shortToLongTime);

        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
        this._statusBarItem.command = 'timer.start';
        this._statusBarItem.tooltip = 'Click to start a pomodoro';
        this._statusBarItem.show();

        this._interval = setInterval(() => this.refreshUI(), 1000);

        this.refreshUI();
    }

    dispose() {
        this._statusBarItem.dispose();
        clearInterval(this._interval);
    }

    refreshUI() {
        let text = this._tomatoTimer.text();
        if (text) {
            this._statusBarItem.text = text;
            this._statusBarItem.command = 'timer.cancel';
            this._statusBarItem.tooltip = 'Cancel';

            if (this._tomatoTimer.isStatusChange()) {
                vscode.window
                    .showInformationMessage(
                        'Pomodoro Process: '+this._tomatoTimer
                            .getStatus()
                            .toUpperCase()
                    );
            }
        } else {
            this.dispose();
        }
    }
}

class TomatoTimer {
    constructor(status, time, shortToLongTime) {
        this._status = status;
        this._time = time;
        this._remainTime = time;
        this._shortToLongTime = shortToLongTime - 1;
        this._breakTime = shortToLongTime - 1;

        this._statusChange = false;
    }

    dispose() {
        this._status = "";
        this._remainTime = 0;
    }

    getRemainTime() {
        return this._remainTime;
    }

    getStatus() {
        return this._status;
    }

    isPomodoro() {
        if ("pomodoro" === this.getStatus()) {
            return true;
        }
        return false;
    }

    isShortBreak() {
        if ("shortBreak" === this.getStatus()) {
            return true;
        }
        return false;
    }

    isLongBreak() {
        if ("longBreak" === this.getStatus()) {
            return true;
        }
        return false;
    }

    remainHumanTime(remain) {
        var text = '';
        var unit = ' seconds';
        let minute_in_second = 60;
        let hour_in_second = 60 * minute_in_second;

        while (0 <= remain) {
            if (hour_in_second < remain) {
                let hours = Math.floor(remain/hour_in_second);
                remain -= hours*hour_in_second;
                text += (hours > 9 ? hours : "0"+hours) + ":";
                unit = ' hours';
            } else if (minute_in_second < remain) {
                let minutes = Math.floor(remain/minute_in_second);
                remain -= minutes*minute_in_second;
                text += (minutes > 9 ? minutes : "0"+minutes) + ":";
                unit = ' minutes';
            } else {
                text += remain > 9 ? remain : "0"+remain;
                remain = -1;
            }
        }

        return text + unit;
    }

    action() {
        // When complete a process
        if (0 > this._remainTime) {
            if (this.isPomodoro()) {
                if (0 < this._breakTime) {
                    this._status = 'shortBreak';
                    this._remainTime = 5*60;
                    this._breakTime--;
                } else if (0 === this._breakTime) {
                    this._status = 'longBreak';
                    this._remainTime = 10*60;
                    this._breakTime = this._shortToLongTime;
                }
            } else {
                this._status = 'pomodoro';
                this._remainTime = this._time;
            }

            this._statusChange = true;
        } else {
            this._statusChange = false;
        }

        return this;
    }

    text() {
        if (!this.isPomodoro() && !this.isShortBreak() && !this.isLongBreak()) {
            this.dispose();
            return false;
        }

        this.action();
        let text = this.remainHumanTime(this._remainTime--);

        if (!text) {
            return 'POMODORO START';
        }

        return this._status.toUpperCase() + ' in ' + text;
    }

    isStatusChange() {
        return this._statusChange;
    }
}