import fs from "fs";
import path from "path";
import {getNZDateString} from "./date.js";

export default function LogToFile(message, logType = "info") {
    const logFilePath = path.join(process.cwd(), "bot_cache", "logs.txt");
    const logMessage = `[${getNZDateString()}] [${logType}] ${message}\n`;

    fs.appendFileSync(logFilePath, logMessage);
}