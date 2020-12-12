import { DMChannel,  Message, MessageEmbed, TextChannel } from "discord.js";

import { singleton } from "tsyringe";
import Discord from "../discord";
import { DiscordMessage, EmbedMessage, TextMessage } from "../dtos/text-message";

@singleton()
class NotificationService {

    constructor(private discord?: Discord) {  
    }

    post(message: DiscordMessage) {
        if (message.type === "text") {
            const text = message as TextMessage;
            this.simpleNotify(text.channel, text.message);
        } else if(message.type === "embed") {
            const embed = message as EmbedMessage;
            this.notify(embed.channel, embed.content, embed.url, embed.title, embed.color)
        }
    }

    simpleNotify(channelName: string, message: string): Promise<Message> {
        if (!channelName || !message) {
            return;
        }

        if (channelName !== process.env.CHANNEL_LOCK && process.env.CHANNEL_LOCK && process.env.CHANNEL_LOCK.length > 0 ) {
            channelName = process.env.CHANNEL_LOCK;
        }

        let guildChannel: TextChannel = this.discord.client.channels.cache.array()
            .filter(channel => channel.type == 'text')
            .map(channel => channel as TextChannel)
            .filter(channel => channel.name.includes(channelName))[0];

        return this.simpleNotifyChannel(guildChannel, message);
    }

    simpleNotifyChannel(guildChannel: DMChannel | TextChannel, message: string): Promise<Message> {
        if (!guildChannel || !message) {
            return;
        }

        let channel: DMChannel | TextChannel = guildChannel;

        if (channel.type === "text" 
                && channel.name !== process.env.CHANNEL_LOCK 
                && process.env.CHANNEL_LOCK 
                && process.env.CHANNEL_LOCK.length > 0 ) {
            this.simpleNotify(process.env.CHANNEL_LOCK, message);

        } else {
            if (channel instanceof DMChannel) {
                return (channel as DMChannel).send(message);
            }else {
                return (channel as TextChannel).send(message);
            }
        }
    }

    notify(channelName: string, message: string, url?: string, title?: string, color?: string) {
        if (process.env.CHANNEL_LOCK && process.env.CHANNEL_LOCK.length > 0) {
            channelName = process.env.CHANNEL_LOCK;
        }
        let guildChannel: TextChannel = this.discord.client.channels.cache.array()
            .filter(channel => channel.type == 'text')
            .map(channel => channel as TextChannel)
            .filter(channel => channel.name.includes(channelName))[0];
        this.notifyChannel(guildChannel, message, url, title, color);
    }

    notifyChannel(guildChannel: DMChannel | TextChannel, message: string, url?: string, title?: string, color?: string) {
        if (!guildChannel || !message || message.replace("\n", "").length == 0) {
            return;
        }

        let channel: DMChannel | TextChannel = guildChannel;

        if (channel.type === "text" 
                && channel.name !== process.env.CHANNEL_LOCK 
                && process.env.CHANNEL_LOCK 
                && process.env.CHANNEL_LOCK.length > 0 ) {
            this.notify(process.env.CHANNEL_LOCK, message, url, title, color);
            return;
        }

        const embed = new MessageEmbed()
            .setColor('#339933')
            .setDescription(message);

        if (color) {
            embed.setColor(color);
        }

        if (title) {
            embed.setTitle(title);
        } else if (!title && url) {
            embed.setTitle(url);
        }

        if (url) {
            embed.setURL(url);
        }

        if (channel instanceof DMChannel) {
            (channel as DMChannel).send(embed);
        }else {
            (channel as TextChannel).send(embed);
        }

    }

}

export default NotificationService;