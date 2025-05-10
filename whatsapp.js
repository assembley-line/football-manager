import {Client} from "whatsapp-web.js";
import Location from "whatsapp-web.js/src/structures/Location.js";
import qrcode from 'qrcode-terminal'
import ora from "ora";
import LocalAuth from "whatsapp-web.js/src/authStrategies/LocalAuth.js";
import LogToFile from "./logger.js";

export default async function initWhatsappConnection() {
    return new Promise((resolve, reject) => {
        const whatsappClient = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            }
        });
        const qrSpinner = ora("Preparing to sign into Whatsapp...").start();

        whatsappClient.on("qr", (qr) => {
            qrSpinner.succeed("QR code generated. Scan it with your phone to log in.");
            qrcode.generate(qr, {small: true});
        });

        whatsappClient.on("ready", () => {
            qrSpinner.succeed("WhatsApp client is ready!");
            resolve(whatsappClient); // Resolve the promise with the client instance
        });

        whatsappClient.on("auth_failure", (msg) => {
            qrSpinner.fail(`Authentication failed: ${msg}`);
            reject(new Error(msg));
        });

        whatsappClient.on("disconnected", (reason) => {
            console.log(`Client was logged out: ${reason}`);
        });

        whatsappClient.on("message", (message) => {
            if (message.body === '!help') {
                message.reply('no lol');
            }
        })

        void whatsappClient.initialize();
    });
}

export async function sendMessageToChatById(client, id, message) {
    const sentMessage = await client.sendMessage(id, message);
    LogToFile(`Sent message to ${id}: ${message}`, 'message')

    return sentMessage
}

export async function sendLocationToChatById(client, id, lat, long, address, name) {
    const location = new Location(lat, long, {
        address: address,
        name: name
    })

    const sentMessage = await client.sendMessage(id, location);
    LogToFile(`Sent location to ${id}: ${address} (${lat}, ${long})`, 'message')

    return sentMessage
}