import chalk from "chalk";

import { LOG_LEVEL } from "./enums.js";

class Logger {
  private static _level = LOG_LEVEL.DEBUG;

  static setLevel(level: LOG_LEVEL) {
    Logger._level = level;
  }

  static error(label: string, ...args: unknown[]) {
    if (Logger._level >= LOG_LEVEL.ERROR) {
      console.log(
        chalk.bgRed.whiteBright(`[${label}]`),
        chalk.redBright(">", ...args)
      );
    }
  }

  static warn(label: string, ...args: unknown[]) {
    if (Logger._level >= LOG_LEVEL.WARN) {
      console.log(
        chalk.bgYellow.black(`[${label}]`),
        chalk.yellow(">", ...args)
      );
    }
  }

  static info(label: string, ...args: unknown[]) {
    if (Logger._level >= LOG_LEVEL.INFO) {
      console.log(chalk.bgCyan.black(`[${label}]`), chalk.cyan(">", ...args));
    }
  }

  static log(label: string, ...args: unknown[]) {
    if (Logger._level >= LOG_LEVEL.LOG) {
      console.log(chalk.dim(`[${label}]`, ">", ...args));
    }
  }

  static debug(...args: unknown[]) {
    if (Logger._level >= LOG_LEVEL.DEBUG) {
      console.log(chalk.bgWhite.black(`[DEBUG]`), ">", ...args);
    }
  }
}

export default Logger;
