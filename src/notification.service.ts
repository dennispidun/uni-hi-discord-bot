import { Channel, Client, DMChannel, GuildChannel, MessageEmbed, TextChannel, VoiceChannel } from "discord.js";



class NotificationService {

    constructor(private discord: Client) {  
    }

    simpleNotify(channelName: string, message: string) {
        if (!channelName || !message) {
            return;
        }

        let guildChannel: TextChannel = this.discord.channels.cache.array()
            .filter(channel => channel.type == 'text')
            .map(channel => channel as TextChannel)
            .filter(channel => channel.name.includes(channelName))[0];
        this.simpleNotifyChannel(guildChannel, message);
    }

    simpleNotifyChannel(guildChannel: DMChannel | TextChannel, message: string) {
        if (!guildChannel || !message) {
            return;
        }

        let channel: DMChannel | TextChannel = guildChannel;

        if (channel.type === "text" 
                && channel.name !== process.env.CHANNEL_LOCK 
                && process.env.CHANNEL_LOCK 
                && process.env.CHANNEL_LOCK.length > 0 ) {
            this.simpleNotify(process.env.CHANNEL_LOCK, message);
            return;
        }
        if (channel instanceof DMChannel) {
            (channel as DMChannel).send(message);
        }else {
            (channel as TextChannel).send(message);
        }
    }

    notify(channelName: string, message: string, url?: string, title?: string, color?: string) {
        if (process.env.CHANNEL_LOCK && process.env.CHANNEL_LOCK.length > 0) {
            channelName = process.env.CHANNEL_LOCK;
        }
        let guildChannel: TextChannel = this.discord.channels.cache.array()
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
            .setTitle(title ? title : 'Hausaufgaben Status')
            .setDescription(message);

        if (color) {
            embed.setColor(color);
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