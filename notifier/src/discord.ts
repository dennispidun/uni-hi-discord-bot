import { Client } from "discord.js";
import { singleton } from "tsyringe";

@singleton()
class Discord {
    private discord = new Client();
    private ready = false;
    constructor() {
        this.discord.on('ready', async () => {
            this.ready = true;
            console.log(`Logged in as ${this.discord.user.tag}, V1.0.0!`);
        });
        
        this.discord.login(process.env.DISCORD_BOT_TOKEN);
    }

    get client(): Client {
        return this.discord;
    }

    isReady(): boolean {
        return this.ready;
    }
}

export default Discord;