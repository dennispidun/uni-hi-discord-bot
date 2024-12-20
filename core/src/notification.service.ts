import { Channel, Client, DMChannel, GuildChannel, Message, MessageEmbed, TextChannel, VoiceChannel } from "discord.js";

import nodemailer from "nodemailer";

class NotificationService {

    constructor(private discord: Client) {  
    }

    emailNotify(to: string, subject: string, text: string) {
        let transporter = nodemailer.createTransport({
            host: "smtp.uni-hildesheim.de",
            port: 465,
            secure: true,
            requireTLS: false,
            auth: {
                user: process.env.UNI_FS_MAIL, 
                pass: process.env.UNI_FS_PASSWORD,
            },
        });
        
        // send mail with defined transport object
        let info = transporter.sendMail({
            from: '"Informatik Fachschaft 💻" <fs_winf@uni-hildesheim.de>', // sender address
            bcc: 'fs_winf@uni-hildesheim.de',
            to, // list of receivers
            subject, // Subject line
            text
        });
    }

    simpleNotify(channelName: string, message: string): Promise<Message> {
        if (!channelName || !message) {
            return;
        }

        if (channelName !== process.env.CHANNEL_LOCK && process.env.CHANNEL_LOCK && process.env.CHANNEL_LOCK.length > 0 ) {
            channelName = process.env.CHANNEL_LOCK;
        }

        let guildChannel: TextChannel = this.discord.channels.cache.array()
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