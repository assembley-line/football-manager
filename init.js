import inquirer from "inquirer";
import ora from "ora";
import {getCompetitions, getFixturesForOrg, getNextFixtureForTeam, getOrganisation} from "./competition.js";
import initWhatsappConnection, {sendLocationToChatById, sendMessageToChatById} from "./whatsapp.js";
import startScheduler from "./scheduler.js";
import LogToFile from "./logger.js";

async function startFlow() {
    LogToFile('----------', 'init')
    // Step 1: Fetch competitions with loading
    const competitionSpinner = ora("Fetching competitions...").start();
    const competitions = (await getCompetitions()).map(competition => ({
        id: competition.Id,
        name: competition.Name,
    }));
    competitionSpinner.succeed("Competitions loaded.");

    const competitionChoices = competitions.map(c => ({name: c.name, value: c.id}));

    const {competitionId} = await inquirer.prompt([
        {
            type: "list",
            name: "competitionId",
            message: "Select a competition:",
            choices: competitionChoices,
        }
    ]);

    // Step 2: Fetch organization with loading
    const orgSpinner = ora("Fetching clubs...").start();
    const organisations = (await getOrganisation(competitionId, 2025)).map(org => ({
        id: org.Id,
        name: org.Name,
    }));
    orgSpinner.succeed(`Clubs loaded`);

    const organisationChoices = organisations.map(o => ({name: o.name, value: o.id}));

    const {organisationId} = await inquirer.prompt([
        {
            type: "list",
            name: "organisationId",
            message: "Select a club:",
            choices: organisationChoices,
        }
    ]);

    const {teamNameValidation} = await inquirer.prompt([
        {
            type: "confirm",
            name: "teamNameValidation",
            message: "Do you want to ensure your team name is correct using the current roster? (If you are not advanced, select yes)",
            default: true,
        }
    ]);

    const {teamName} = await inquirer.prompt([
        {
            type: "input",
            name: "teamName",
            message: "What's your team name (Full name, including club name and age group)?",
            validate: async (value) => {
                if (!teamNameValidation) {
                    return true;
                }
                const from = new Date((new Date().getFullYear()), 0, 1);
                const to = new Date((new Date().getFullYear()), 11, 31);
                const fixtures = (await getFixturesForOrg(competitionId, organisationId, 2025, to, from)).fixtures;
                const teams = new Set(fixtures.map((fixture) => {
                    return fixture.HomeTeamNameAbbr
                }).concat(fixtures.map((fixture) => {
                    return fixture.AwayTeamNameAbbr
                })));
                if (teams.has(value)) {
                    return true;
                }
                return `Couldn't retrieve team from fixture records. Check if team has a valid fixture in this season and try again. (Recommended to copy team name exactly)`;
            }
        }
    ]);

    const {alertPlatform} = await inquirer.prompt([
        {
            type: "list",
            name: "alertPlatform",
            message: "What messaging platform do you want alerts to come through?:",
            choices: ["Whatsapp"],
        }
    ]);

    if (alertPlatform === "Whatsapp") {
        const client = await initWhatsappConnection();

        const chatsSpinner = ora("Getting your Whatsapp chats...").start();
        const chats = await client.getChats();
        const chatChoices = chats.map(chat => ({name: chat.name, value: chat.id._serialized}));
        chatsSpinner.succeed("Chats loaded.");

        const {chatId} = await inquirer.prompt([
            {
                type: "list",
                name: "chatId",
                message: "Select a chat to send alerts to:",
                choices: chatChoices,
            }
        ]);

        startScheduler(client, chatId, teamName, organisationId, competitionId, 2025);
    }
}

void startFlow();