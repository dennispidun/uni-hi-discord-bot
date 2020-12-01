import Axios from "axios";
import { Client, DMChannel, GuildChannel, TextChannel } from "discord.js";
import NotificationService from "../notification.service";
import cron from "node-cron";

const http = Axios.create({
    withCredentials: true
  });

const ranks = [":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:"];

class LeaderboardService {

    constructor(private discord: Client, private notify: NotificationService) {
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
                leaderboard.push(response.data.members[member]);
            }
            return leaderboard;
        });
    }

    async sendCurrentLeaderboard(channel: DMChannel | TextChannel): Promise<void> {
        let leaderboard = await this.getLeaderboard();
        leaderboard = leaderboard.sort(this.compare);
        let text = "";
        let rank = 1;
        let count = 0;
        let lastScore = -1;
        for (let member of leaderboard) {
            if (!member.name || member.name === null) {
                member.name = "Anonymer Teilnehmer #" + member.id;
            }

            member.name = member.name.trim();

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
}

export default LeaderboardService;