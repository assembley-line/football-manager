import {getNextFixtureForTeam} from "./competition.js";
import {sendLocationToChatById, sendMessageToChatById} from "./whatsapp.js";

import fs from "fs";
import path from "path";
import LogToFile from "./logger.js";
import {getNZDate} from "./date.js";

export default async function startScheduler(client, chatId, teamName, orgId, compId, season) {
    const timeFrame = 60 * 60 * 1000; // 1 hour in milliseconds

    void updateFixtureData(client, chatId, teamName, orgId, compId, season)
    setInterval(() => updateFixtureData(client, chatId, teamName, orgId, compId, season), timeFrame)
}

function readOrCreateJSON(filePath, defaultData = {}) {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContents);
    } catch (error) {
        if (error.code === 'ENOENT') {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        throw error;
    }
}

function writeToJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const filter = (prevObj, newObj) => {
    const result = {};
    Object.keys(prevObj).forEach((key) => {
        if (prevObj[key] !== newObj[key]) {
            result[key] = newObj[key];
        }
    })
    return result;
};

async function updateFixtureData(client, chatId, teamName, orgId, compId, season) {
    if (7 >= getNZDate().getHours() >= 19) {
        LogToFile(`Prevented update during the night`)
        return
    }

    LogToFile(`Looking for fixtures, 2 weeks ahead...`)
    await getNextFixtureForTeam(compId, orgId, season, 1209600000, teamName) // Looks ahead 2 weeks
        .then((nextFixture) => {
            if (nextFixture) {
                const {HomeTeamNameAbbr, AwayTeamNameAbbr, VenueName, Address, Longitude, Latitude, Status, Id} = nextFixture;

                LogToFile(`Retrieved fixture data: ${nextFixture.Id}`)

                const fixtureCache = readOrCreateJSON(path.join(process.cwd(), "bot_cache", "fixture_cache.json"), {});

                LogToFile(`Loaded fixture cache of ID: ${fixtureCache.Id}`)

                const date = new Date(nextFixture.Date);
                const formattedDate = date.toLocaleString("en-NZ", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                })

                const formattedCacheDate = new Date(fixtureCache.Date).toLocaleString("en-NZ", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                })

                if (fixtureCache.Id !== Id) {
                    const message = `Your team "*${teamName}*" has a match coming up!\n\n*Fixture Details:*\n*Home Team:* ${HomeTeamNameAbbr}\n*Away Team:* ${AwayTeamNameAbbr}\n*Date:* ${formattedDate}\n*Venue:* ${VenueName}\n*Address:* ${Address}\n*Status:* ${Status}\n`;
                    void sendMessageToChatById(client, chatId, message).then(() => {
                        void sendLocationToChatById(client, chatId, parseFloat(Latitude), parseFloat(Longitude), Address, VenueName)
                    })
                } else if (nextFixture !== fixtureCache && nextFixture.Status !== "PLAYED") {
                    const difference = filter(fixtureCache, nextFixture);
                    const messages = []

                    for (const key in difference) {
                        switch (key) {
                            case "HomeTeamNameAbbr":
                                messages.push(`*Home Team* has changed from ${fixtureCache.HomeTeamNameAbbr} to ${HomeTeamNameAbbr}\n`);
                                break;
                            case "AwayTeamNameAbbr":
                                messages.push(`*Away Team* has changed from ${fixtureCache.AwayTeamNameAbbr} to ${AwayTeamNameAbbr}\n`);
                                break;
                            case "VenueName":
                                messages.push(`*Venue* has changed from ${fixtureCache.VenueName} to ${VenueName}\n`);
                                break;
                            case "Address":
                                messages.push(`*Address* has changed from ${fixtureCache.Address} to ${Address}\n`);
                                break;
                            case "Longitude":
                                messages.push(`*Longitude* has changed from ${fixtureCache.Longitude} to ${Longitude}\n`);
                                break;
                            case "Latitude":
                                messages.push(`*Latitude* has changed from ${fixtureCache.Latitude} to ${Latitude}\n`);
                                break;
                            case "Status":
                                messages.push(`*Status* has changed from ${fixtureCache.Status} to ${Status}\n`);
                                break;
                            case "Date":
                                messages.push(`*Date* has changed from ${formattedCacheDate} to ${formattedDate}\n`);
                                break;
                        }
                    }

                    if (messages.length > 0) {
                        void sendMessageToChatById(client, chatId, `Your team "*${teamName}*" has an update on the upcoming match!\n\n*Fixture Changes:*\n${messages.join('\n')}`).then(() => {
                            const message = `*Here's an updated overview:*\n*Home Team:* ${HomeTeamNameAbbr}\n*Away Team:* ${AwayTeamNameAbbr}\n*Date:* ${formattedDate}\n*Venue:* ${VenueName}\n*Address:* ${Address}\n*Status:* ${Status}\n`;
                            void sendMessageToChatById(client, chatId, message).then(() => {
                                void sendLocationToChatById(client, chatId, parseFloat(Latitude), parseFloat(Longitude), Address, VenueName)
                            })
                        })
                    }
                }

                if (fixtureCache !== nextFixture) {
                    writeToJSON(path.join(process.cwd(), "bot_cache", "fixture_cache.json"), nextFixture);
                    LogToFile(`Updated fixture cache of ID: ${nextFixture.Id}`)
                }
            }
        })
        .catch((error) => {
            LogToFile(`Could not fetch fixtures, error: ${error}`, "error")
        });
}