# Tomato Timer

The time management for a more productive way to work on VS Code with Pomodoro technique.

* Author: tungvn
* Extension URI: [https://gitlab.com/tungvn/tomato-timer](https://gitlab.com/tungvn/tomato-timer)

## Features

* Follow [Pomodoro technique](https://en.wikipedia.org/wiki/Pomodoro_Technique).
* After each pomodoro, we have a short break. We have long break in 1 times each 3 (can be customized) short break times.
* Extension show a count down clock and name of process.
* Extension will show an information box to announce.

### Install instructions

Install via Extension Marketplace
- Open Command on Visual Studio Code (Ctrl+Shift+P on Windows or Cmd+Shift+P on Mac/OSX)
- > ext install tomato-timer
- Wait until install complete and restart VS Code

Install by Packaged Extension (.vsix)
- You can manually install an VS Code extension packaged in a .vsix file. Simply install using the VS Code command line providing the path to the .vsix file.
- >code extension_name.vsix
- The extension will be installed under your user .vscode/extensions folder. You may provide multiple .vsix files on the command line to install multiple extensions at once.
- You can also install a .vsix by opening the file from within VS Code. Run File > Open File... or Ctrl+O and select the extension .vsix.

## Extension Settings

This extension contributes the following settings:

* `tomatoTimer.shortBreakToLongBreakTime`: The number short break time between pomodoro then have long break time, default is 3 times.

## Release Notes

### 1.5.0 - 2018/05/10
- Add more configurations about time of short and long break
- Update follow and UI actions
- Use EventEmitter to notice

### 1.0.0 First commit

Initial release of Tomato Timer

## Issues

Need to be improve or fix the bugs, click [here](https://gitlab.com/tungvn/tomato-timer/issues/new)