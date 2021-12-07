import { Client, DMChannel, TextChannel } from "discord.js";
import SparkyAuth from "./sparky/sparky-client";
import CoursesService from "./courses.service";
import NotificationService from "./notification.service";
import { env } from "process";
import LeaderboardService from "./aoc/leaderboard.service";
import ExamsService from "./old-exams/exams.service";
import { Dropbox } from "dropbox";
// import { Assignment, AssignmentLink, AssignmentState, Course, DiffAssignment } from "./sparky/stmgmt-course.model";

// Create an instance of a Discord client
const discord = new Client();

const sparky = new SparkyAuth({ username: process.env.UNI_USERNAME, password: process.env.UNI_PASSWORD });
let coursesService: CoursesService;

let notifyService: NotificationService;
let leaderboardService: LeaderboardService;
let dbx: Dropbox;
discord.on('ready', async () => {
 

  notifyService = new NotificationService(discord);

  new ExamsService(discord, notifyService);

  leaderboardService = new LeaderboardService(discord, notifyService);

  coursesService = new CoursesService(notifyService, sparky);
 
  console.log(`Logged in as ${discord.user.tag}, V1.0.0!`);
});

discord.on('message', async (message) => {
  if (message.content === "!leaderboard" || message.content === "!lb") {
    if (message.channel.type === "text") {
      let channel: DMChannel = await message.author.createDM();
      if (message.channel.name === "advent-of-code" || message.channel.name === "test") {
        leaderboardService.sendCurrentLeaderboard(channel);
      }
    } else if (message.channel.type === "dm") {
      let channel: DMChannel = await message.author.createDM();
      leaderboardService.sendCurrentLeaderboard(channel);
    }
  }
});

discord.login(process.env.DISCORD_BOT_TOKEN);
