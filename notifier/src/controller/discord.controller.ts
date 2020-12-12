import { TextChannel } from "discord.js";
import { Body, Get, JsonController, Post } from "routing-controllers";
import { container } from "tsyringe";
import Discord from "../discord";
import { TextChannelI } from "../interfaces/text-channel.interface";
import { EmbedMessage, TextMessage } from "../dtos/text-message";
import NotificationService from "../services/notifier";

@JsonController("/discord")
export default class DiscordController {

    private discord = container.resolve(Discord)
    private notifier = container.resolve(NotificationService);
    
    constructor() {
    }

    @Post()
    postMessage(@Body() msg: TextMessage | EmbedMessage) {
        this.notifier.post(msg);
    }

    @Get()
    get() {
        return this.discord.client.channels.cache
            .filter(channel => channel.type == "text")
            .map(channel => channel as TextChannel)
            .map(this.formatTextChannel);
    };

    private formatTextChannel(channel: TextChannel): TextChannelI {
        return {
            id: channel.id,
            name: channel.name
        };
    }

}