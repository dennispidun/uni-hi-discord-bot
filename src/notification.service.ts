import { Client, MessageEmbed, TextChannel } from "discord.js";

class NotificationService {

    constructor(private discord: Client) {        
    }

    notify(channelName: string, message: string, url?: string, title?: string, color?: string) {
        if (!message || message.replace("\n", "").length == 0) {
            return;
        }

        channelName = "discord"
        if (process.env.CHANNEL_LOCK && process.env.CHANNEL_LOCK.length > 0) {
            channelName = process.env.CHANNEL_LOCK;
        }

        let guildChannel: TextChannel = this.discord.channels.cache.array()
            .filter(channel => channel.type == 'text')
            .map(channel => channel as TextChannel)
            .filter(channel => channel.name.includes(channelName))[0];
        const embed = new MessageEmbed()
            .setColor('#339933')
            .setTitle(title ? title : 'Hausaufgaben Status')
            .setDescription(message);

        if (color) {
            embed.setColor(color);
        }

        if (url) {
            embed.setURL(url);
        }

        guildChannel.send(embed);
    }

}

export default NotificationService;