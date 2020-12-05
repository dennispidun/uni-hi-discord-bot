import { Client, DMChannel, Message } from "discord.js";
import NotificationService from "../notification.service";

import FileSync from "lowdb/adapters/FileSync";
import low from 'lowdb';
import { Dropbox } from "dropbox";
import SharingService from "./sharing";

type Schema = {
    messages: {
        i_id: string,
        email: string,
        search: string,
        id: string,
        exams: string[],
        link?: string
    }[];
};

const REACT_NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const adapter = new FileSync<Schema>('oldexams.db.json')
const db = low(adapter);

class ExamsService {

    dbx: Dropbox;
    sharing: SharingService;

    constructor(private discord: Client, private notify: NotificationService) {
        this.sharing = new SharingService();
        this.dbx = new Dropbox({ accessToken: process.env.DBX_TOKEN });

        db.defaults({ messages: [] }).write();
        this.registerMessageListener();
        this.registerReactionListener();
    }

    private registerMessageListener() {
        this.discord.on('message', async (message) => {
            if (message.channel.type === "text" && message.channel.name === "altklausuren-anfragen") {
                const email = message.cleanContent.match(/(.*[\s\-\\])*([a-zA-Z0-9\-]+@uni-hildesheim\.de).*/);
                let channel: DMChannel = await message.author.createDM();
                if (!email) {
                    this.notify.notifyChannel(channel, "Du musst eine Uni-E-Mail angeben, damit wir dich kontaktieren können.", undefined, "Altklausuranfrage", "#ff0028");
                } else {
                    const text = message.cleanContent.replace(email[2], "").trim();
                    let exams = await this.getExams(text);
                    
                    if (exams.length > 0) {
                        let internalMsg: Message = await this.notify.simpleNotify(
                            "altklausuren-intern", this.generateInternalMessage({ search: text, email: email[2], exams: [] }));
    
                        await internalMsg.react('👍');
                        await internalMsg.react('👎');
                        this.write({ i_id: internalMsg.id, email: email[2], search: text, id: message.author.id, exams });
                        this.notify.notifyChannel(channel, `Dir wird unter \`${email[2]}\` der Download-Link zum Modul/Fach (\`${text}\`) zugeschickt, bitte habe Geduld. Deine Anfrage wird noch manuell von uns bestätigt.`, undefined, "Altklausuranfrage");
                    } else {
                        this.notify.notifyChannel(channel, `Für deine Suche (\`${text}\`) wurden keine Dokumente gefunden. Bei Fragen wende dich bitte an: \`fs_winf@uni-hildesheim.de\`.`, undefined, "Altklausuranfrage", "#ff0028");
                    }                    
                }
                
                message.delete();
            }
        });
    }

    private registerReactionListener() {
        this.discord.on('messageReactionAdd', async (reaction, user) => {
            if (user.tag === "Jarvis#0888") {
                return;
            }

            if (!reaction.users.cache.some(user => user.tag === "Jarvis#0888")) {
                return;
            }

            if (reaction.emoji.name !== "👍" && reaction.emoji.name !== "👎") {
                return;
            }

            let approved = false;
            if (reaction.emoji.name === "👍") {
                approved = true;
            }

            const guild = reaction.message.guild;
            const reactMember = guild.members.cache.get(user.id);

            if (!reactMember.roles.cache.some(r => r.name === "Fachschaft")) {
                return;
            }

            let foundMessage = db.get('messages').find({ i_id: reaction.message.id }).value();
            if (foundMessage) {
                // const dm = await guild.members.cache.get(foundMessage.id).createDM();
                // this.notify.simpleNotifyChannel(dm, "Deine Anfrage zu `" + foundMessage.search + "` wurde **" + (!approved ? "abgelehnt**." : 
                //     "angenommen**. Du wirst in Kürze eine E-Mail mit den Unterlagen erhalten."));
                reaction.message.reactions.removeAll();
                const exams = foundMessage.exams;

                for (let i = 0; i < exams.length && i < REACT_NUMBERS.length; i++) {
                    await reaction.message.react(REACT_NUMBERS[i]);
                }

                await reaction.message.edit(this.generateInternalMessage(foundMessage));
            }
        });

        this.discord.on('messageReactionAdd', async (reaction, user) => {
            if (user.tag === "Jarvis#0888") {
                return;
            }

            if (!reaction.users.cache.some(user => user.tag === "Jarvis#0888")) {
                return;
            }

            if (!(REACT_NUMBERS.includes(reaction.emoji.name))) {
                return;
            }

            let foundMessage = db.get('messages').find({ i_id: reaction.message.id }).value();
            if (!foundMessage) {
                return;
            }

            const exams = foundMessage.exams;
            try {
                const exam = exams[REACT_NUMBERS.indexOf(reaction.emoji.name)];

                const shareLink = await this.sharing.getLink(exam);
                let link = shareLink ? shareLink.link : "";

                if (!shareLink) {
                    link = (await this.dbx.sharingCreateSharedLinkWithSettings(
                        {
                            settings: {
                                access: {
                                    ".tag": "viewer"
                                },
                                requested_visibility: {
                                    '.tag': 'public'
                                }
                            },
                            path: "/" + exam
                        })).result.url;
                }
                foundMessage.link = link;
                this.sharing.addShareLink(exam, foundMessage.link);
            } catch (e) {
                console.log(e);
            }

            await reaction.message.reactions.removeAll();
            this.write(foundMessage);

            for (let i = 0; i < exams.length && i < REACT_NUMBERS.length; i++) {
                await reaction.message.react(REACT_NUMBERS[i]);
            }

            await reaction.message.edit(this.generateInternalMessage(foundMessage));
            reaction.message.react('📨');

        });

        this.discord.on('messageReactionAdd', async (reaction, user) => {
            if (user.tag === "Jarvis#0888") {
                return;
            }

            if (!reaction.users.cache.some(user => user.tag === "Jarvis#0888")) {
                return;
            }

            if (reaction.emoji.name !== '📨') {
                return;
            }

            let foundMessage = db.get('messages').find({ i_id: reaction.message.id }).value();
            if (!foundMessage) {
                return;
            }
            const guild = reaction.message.guild;

            this.notify.emailNotify(
                foundMessage.email, 
                "Deine Altklausurenanfrage ✔",
                "Dein Download-Link für deine Anfrage steht bereit \n\n"
                + foundMessage.link + "\n\nDieser Link ist genau 5 Tage gültig!"
                + "\n\nBei organisatorischen Fragen kannst du dich gerne bei uns melden."
                + "\n\n\nViele Grüße\nDeine Informatik Fachschaft 💻");

            await reaction.message.reactions.removeAll();
            reaction.message.react('🆗');
        });
    }

    private write(messages: { i_id: string, email: string, search: string, id: string, exams: string[], link?: string }) {
        db.get('messages')
            .remove({ i_id: messages.i_id })
            .write();

        db.get('messages').push(messages).write();
    }

    async getExams(search?: string): Promise<string[]> {
        return (await this.dbx.filesListFolder({ path: '' }))
            .result.entries.map(e => e.name)
            .filter(e => search
                && search.length > 1
                && (e === search || search.includes(e)
                    || e.includes(search)));
    }

    generateInternalMessage(msg: { email: string, search: string, exams: string[], link?: string }): string {
        console.log(msg);
        if (!msg.exams) {
            msg.exams = [];
        }

        let message = "`" + msg.search + "` für " + msg.email;
        for (let i = 0; i < msg.exams.length && i < 10; i++) {
            message += "\n" + REACT_NUMBERS[i] + " -> /apps/DiscordExams/**" + msg.exams[i] + "**";
        }

        if (msg.link) {
            message += "\n" + msg.link;
        }

        return message;
    }


}

export default ExamsService;