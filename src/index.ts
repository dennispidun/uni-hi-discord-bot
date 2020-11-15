import { Client, TextChannel } from "discord.js";
import SparkyAuth from "./sparky/sparky-client";
import CoursesService from "./courses.service";
import NotificationService from "./notification.service";
import { env } from "process";
// import { Assignment, AssignmentLink, AssignmentState, Course, DiffAssignment } from "./sparky/stmgmt-course.model";

// Create an instance of a Discord client
const discord = new Client();

const sparky = new SparkyAuth({username: process.env.UNI_USERNAME, password: process.env.UNI_PASSWORD});
let coursesService: CoursesService;

let notifyService: NotificationService;

discord.on('ready', async () => {
  notifyService = new NotificationService(discord);
  coursesService = new CoursesService(notifyService, sparky);

  const courses = await sparky.getCourses();
  
  // let exampleCourse: Course = {id: "java-wise2021", shortname: "java", title: "Java Praktikum 1 bla bla"}
  // let diffAssignments: DiffAssignment[] = []
  // let assignment1_links: AssignmentLink[] = [];
  // assignment1_links.push({name: "Hausaufgabe", url: "https://google.de"});
  // assignment1_links.push({name: "Stu-Mgmt Kurs", url: "https://uni-hildesheim.de"});
  // let assignment_old1: Assignment = {id: "dsfsdfsdf", "name": "TestAufgabe1", state: AssignmentState.INVISIBLE, endDate: new Date(Date.parse("2020-11-03T11:00:00.000Z"))};
  // let assignment_new1: Assignment = {id: "dsfsdfsdf", "name": "TestAufgabe1", state: AssignmentState.IN_PROGRESS, endDate: new Date(Date.parse("2020-11-03T11:00:00.000Z")), links: assignment1_links};
  // diffAssignments.push({old: assignment_old1, new: assignment_new1});
  // let assignment_old2: Assignment = {id: "dsfsdfsdf", "name": "TestAufgabe1", state: AssignmentState.IN_PROGRESS, endDate: new Date(Date.parse("2020-11-03T11:00:00.000Z"))};
  // let assignment_new2: Assignment = {id: "dsfsdfsdf", "name": "TestAufgabe1", state: AssignmentState.IN_REVIEW, endDate: new Date(Date.parse("2020-11-03T11:00:00.000Z"))};
  // diffAssignments.push({old: assignment_old2, new: assignment_new2});
  // let assignment_old3: Assignment = {id: "dsfsdfsdf", "name": "TestAufgabe1", state: AssignmentState.IN_REVIEW, endDate: new Date(Date.parse("2020-11-03T11:00:00.000Z"))};
  // let assignment_new3: Assignment = {id: "dsfsdfsdf", "name": "TestAufgabe1", state: AssignmentState.EVALUATED, endDate: new Date(Date.parse("2020-11-03T11:00:00.000Z"))};
  // diffAssignments.push({old: assignment_old3, new: assignment_new3});
  // let assignment_old4: Assignment = {id: "dsfsdfsdf", "name": "TestAufgabe1", state: AssignmentState.IN_PROGRESS, endDate: new Date(Date.parse("2020-11-03T11:00:00.000Z"))};
  // let assignment_new4: Assignment = {id: "dsfsdfsdf", "name": "TestAufgabe1", state: AssignmentState.IN_PROGRESS, endDate: new Date(Date.parse("2020-11-03T12:00:00.000Z"))};
  // diffAssignments.push({old: assignment_old4, new: assignment_new4});
  
  // coursesService.notifyAssignments(exampleCourse, diffAssignments);

  console.log(`Logged in as ${discord.user.tag}, V1.0.0!`);
});

discord.login(process.env.DISCORD_BOT_TOKEN);