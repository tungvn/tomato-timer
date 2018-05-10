'use strict';

const EventEmitter = require('events');
const vscode = require('vscode');
const _STATUS = {
  POMODORO: 'pomodoro',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
};
const MINUTE_IN_SECONDS = 60;
const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;

function activate(context) {
  // Get settings
  const settings = vscode.workspace.getConfiguration().get("tomatoTimer");
  const shortBreakTime = (settings && settings.shortBreakTime) || 5;
  const longBreakTime = (settings && settings.longBreakTime) || 10;
  const shortBreakToLongBreakTime = (settings && settings.shortBreakToLongBreakTime) || 3;
  const options = {
    shortBreakTime,
    longBreakTime,
    shortBreakToLongBreakTime,
  };

  // Define status bar item for tomato timer
  const statusBarItem = new TomatoTimerBarItem(options);
  context.subscriptions.push(statusBarItem);

  // Action create new Pomodoro
  const timerStart = vscode.commands.registerCommand('timer.start', function () {
    vscode.window
      .showQuickPick(['15 minutes', '20 minutes', '25 minutes', '45 minutes', '60 minutes'])
      .then(function (time) {
        if (typeof time == 'undefined') {
          return false;
        }

        const timePomo = parseInt(time);
        vscode.window.showInformationMessage('Pomodoro start with ' + time + '!');
        statusBarItem.start(timePomo * MINUTE_IN_SECONDS);
      });

  });
  context.subscriptions.push(timerStart);

  // Action cancel exists Pomodoro
  const timerStop = vscode.commands.registerCommand('timer.cancel', function () {
    vscode.window
      .showQuickPick(['Stop Pomodoro', 'Continue Pomodoro'])
      .then(function (c) {
        if (!c || c === 'Continue Pomodoro') {
          return false;
        }
        vscode.window.showWarningMessage('Pomodoro stopped!');
        statusBarItem.dispose();
      });
  });
  context.subscriptions.push(timerStop);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;

class TomatoTimerBarItem {
  constructor(options) {
    this._options = options;

    this._tomatoTimer = null;
    this._interval = null;
    this._isStart = false;

    this.init();
  }

  init() {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    this._statusBarItem.command = 'timer.start';
    this._statusBarItem.text = '$(triangle-right) Start a pomodoro';
    this._statusBarItem.show();
  }

  dispose() {
    this._tomatoTimer.dispose();
    this._statusBarItem.dispose();
    clearInterval(this._interval);

    this.init();
  }

  start(time) {
    this._isStart = true;
    this._statusBarItem.command = 'timer.cancel';

    this._tomatoTimer = new TomatoTimer(time, this._options);
    this._tomatoTimer.start();
    this._tomatoTimer.on('stateChange', (state) => {
      vscode.window.showInformationMessage('Pomodoro state change to ' + state.toUpperCase());
    });

    this._start();
    this._interval = setInterval(() => this._start(), 1000);
  }

  _start() {
    const text = this._tomatoTimer.display();
    if (text) {
      this._statusBarItem.text = `$(x) ${text}`;
    }
  }
}

class TomatoTimer extends EventEmitter {
  constructor(time, options) {
    super();

    this._options = options;
    this._time = time;
    this._remainTime = time;
    this._isStart = false;
  }

  dispose() {
    this._status = '';
    this._remainTime = 0;
    this._isStart = false;
  }

  start() {
    this._status = _STATUS.POMODORO;
    this._shortBreakTimeCountDown = this._options.shortBreakToLongBreakTime || 3;
    this._breakTime = this._shortBreakTimeCountDown - 1;
    this._isStart = true;
  }

  getRemainTime() {
    return this._remainTime;
  }

  isStart() {
    return this._isStart;
  }

  getStatus() {
    return this._status;
  }

  isPomodoro() {
    return _STATUS.POMODORO === this.getStatus();
  }

  isShortBreak() {
    return _STATUS.SHORT_BREAK === this.getStatus();
  }

  isLongBreak() {
    return _STATUS.LONG_BREAK === this.getStatus();
  }

  remainHumanTime() {
    let remain = this._remainTime;
    let text = '';
    let unit = ' seconds';
    if (remain <= 0) {
      return text;
    }

    while (0 <= remain) {
      if (HOUR_IN_SECONDS < remain) {
        let hours = Math.floor(remain / HOUR_IN_SECONDS);
        remain -= hours * HOUR_IN_SECONDS;
        text += `${hours}`.padStart(2, '0') + ":";
        unit = ' hours';
      } else if (MINUTE_IN_SECONDS < remain) {
        let minutes = Math.floor(remain / MINUTE_IN_SECONDS);
        remain -= minutes * MINUTE_IN_SECONDS;
        text += `${minutes}`.padStart(2, '0') + ":";
        unit = ' minutes';
      } else {
        text += `${remain}`.padStart(2, '0');
        remain = -1;
      }
    }

    return text + unit;
  }

  state() {
    // When complete a process
    if (0 >= this._remainTime) {
      if (this.isPomodoro()) {
        if (0 < this._breakTime) {
          this._status = _STATUS.SHORT_BREAK;
          this._remainTime = this._options.shortBreakTime * MINUTE_IN_SECONDS;
          this._breakTime--;
          this.emit('stateChange', this.getStatus());
        } else if (0 === this._breakTime) {
          this._status = _STATUS.LONG_BREAK;
          this._remainTime = this._options.longBreakTime * MINUTE_IN_SECONDS;
          this._breakTime = this._shortBreakTimeCountDown - 1;
          this.emit('stateChange', this.getStatus());
        }
      } else {
        this._status = _STATUS.POMODORO;
        this._remainTime = this._time;
        this.emit('stateChange', this.getStatus());
      }
    }
  }

  display() {
    this._remainTime--;
    this.state();
    return this._status.toUpperCase() + ' in ' + this.remainHumanTime();
  }
}