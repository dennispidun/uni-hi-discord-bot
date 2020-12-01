import Axios from "axios";
import low from 'lowdb';
import { Client, DMChannel, GuildChannel, TextChannel } from "discord.js";
import NotificationService from "../notification.service";
import cron from "node-cron";
import FileSync from "lowdb/adapters/FileSync";


import * as _ from 'lodash';

type Schema = {
    leaderboard: LeaderboardMember[];
};

const adapter = new FileSync<Schema>('aoc-leaderboard.db.json')
const db = low(adapter)


const http = Axios.create({
    withCredentials: true
  });

const ranks = [":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:"];

class LeaderboardService {

    constructor(private discord: Client, private notify: NotificationService) {
        db.defaults({ leaderboard: []}).write();
        cron.schedule('0 6 * * *', async () => {
            var dateObj = new Date();
            var month = dateObj.getUTCMonth() + 1;
            var day = dateObj.getUTCDate();
            if (month == 12) {
                let guildChannel: TextChannel = this.discord.channels.cache.array()
                    .filter(channel => channel.type == 'text')
                    .map(channel => channel as TextChannel)
                    .filter(channel => channel.name === "advent-of-code")[0];
                this.notify.simpleNotifyChannel(guildChannel, ":sparkles: Die Aufgaben für den **" + day + ". Tag** von Advent-Of-Code können nun gelöst werden! :sparkles:");
                if (day > 1) {
                    this.sendCurrentLeaderboard(guildChannel);
                }
            }
            
        });

        cron.schedule('* */5 * * * *', async () => {
            let leaderboard = await this.getLeaderboard();
            var dateObj = new Date();
            var day = dateObj.getUTCDate();

            leaderboard.forEach((member: LeaderboardMember) => {

                let beforeMember = db.get('leaderboard')
                    .find({ id: member.id })
                    .value();

                if (!beforeMember) {
                    beforeMember = member;
                }

                let before = beforeMember.completion_day_level['' + day];
                let after = member.completion_day_level['' + day];

                if (!_.isEqual(before, after)) {
                    let message;
                    if (before === undefined && after['1'] !== undefined && after['2'] === undefined) {
                        const time = this.getFormattedDate(after['1']['get_star_ts']);
                        message = `**${member.name}** hat die erste Aufgabe von Tag ${day} um ${time}Uhr gelöst!`;
                        this.notify.simpleNotify("advent-of-code", `**${member.name}** hat die erste Aufgabe von Tag ${day} um ${time}Uhr gelöst!`);
                    } else if (before && before['1'] !== undefined && after['1'] !== undefined && after['2'] !== undefined) {
                        const time = this.getFormattedDate(after['2']['get_star_ts']);
                        message = `**${member.name}** hat die zweite Aufgabe von Tag ${day} um ${time}Uhr gelöst!`;
                    } else if (before === undefined && after['1'] !== undefined && after['2'] !== undefined) {
                        const time = this.getFormattedDate(after['2']['get_star_ts']);
                        message = `**${member.name}** hat beide Aufgaben von Tag ${day} um ${time}Uhr gelöst!`;
                    }
                    this.notify.simpleNotify("advent-of-code", message);
                }
                
                db.get('leaderboard')
                    .remove({ id: member.id })
                    .write();
                
                db.get('leaderboard').push(member).write();
            })
        })

    }

    getFormattedDate(unix_timestamp: number) {
        var date = new Date(unix_timestamp * 1000);
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var seconds = "0" + date.getSeconds();
        return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    }

    async getLeaderboard(): Promise<LeaderboardMember[]> {
        return await http.get("https://adventofcode.com/2020/leaderboard/private/view/970052.json", {
            headers: {
                Cookie: "session=" + process.env.SESSION_COOKIE + ";"
            }
        }).then(response => {
            let leaderboard: LeaderboardMember[] = [];

            for(let member of Object.keys(response.data.members)) {
                // response.data.members[member].local_score = Math.floor(Math.random() * 130) + 1;  
                let lbMember: LeaderboardMember = response.data.members[member];       
                this.normalizeName(lbMember);       
                leaderboard.push(lbMember);
            }
            
            leaderboard = leaderboard.sort(this.compare);
            return leaderboard;
        });
    }

    normalizeName(member: LeaderboardMember) {
        if (!member.name || member.name === null) {
            member.name = "Anonymer Teilnehmer #" + member.id
        }
        member.name = member.name.trim();
    }

    async sendCurrentLeaderboard(channel: DMChannel | TextChannel): Promise<void> {
        let leaderboard = await this.getLeaderboard();
        let text = "";
        let rank = 1;
        let count = 0;
        let lastScore = -1;
        for (let member of leaderboard) {
            let rankStr = (rank <= 10 ? ranks[rank - 1]: "");
            let extra = "";
            if (rank == 1) {
                extra = ":crown:";
            } else if (rank == 2) {
                extra = ":star2:";
            } else if (rank == 3) {
                extra = ":star:";
            }
            rank++;
            text += (extra !== "" ? extra : rankStr) + " " + member.name +" **[ " + member.local_score + " ]**\n";
            if (count == 2) {
                text += "\n";
            }
            count++;
            if (count >= 10) {
                break;
            }
        }
        text += "";
        this.notify.notifyChannel(channel, text, undefined, "Advent Of Code: Top10 Leaderboard", "#e72a64");
        if (channel.type === "text") {
            this.notify.simpleNotifyChannel(channel, "_Hint: Das Leaderboard kann auch mit dem Befehl `!leaderboard` jederzeit aufgerufen werden._");
        }

        return Promise.resolve();
    }

    private compare( a: LeaderboardMember, b: LeaderboardMember ) {
        if ( a.local_score < b.local_score ){
            return 1;
        }
        if ( a.local_score > b.local_score ){
            return -1;
        }
        return 0;
    }


}

interface LeaderboardMember {
    id: string;
    name: string;
    local_score: number;
    completion_day_level?: any;
}

export default LeaderboardService;