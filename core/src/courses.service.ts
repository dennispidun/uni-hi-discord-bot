import FileSync from 'lowdb/adapters/FileSync';
import low from 'lowdb';
import { Assignment, AssignmentState, Course, DiffAssignment } from './sparky/stmgmt-course.model';

import cron from "node-cron";
import NotificationService from './notification.service';
import SparkyAuth from './sparky/sparky-client';

import * as _ from 'lodash';

type Schema = {
    courses: Course[];
};

const adapter = new FileSync<Schema>('courses.db.json')
const db = low(adapter)

export class CoursesService {

    constructor(private notify: NotificationService, private sparky: SparkyAuth) {
        db.defaults({ courses: []}).write();
        this.update();
        cron.schedule('5,45 * * * *', () => {
            this.update();
        });
    }

    update = () => {
        console.log("update");
        this.sparky.getCourses().then(courses => {
            console.log("courses: ", courses);
            const newCourses: Course[] = courses.filter(course => !this.hasCourse(course));
            const oldCourses: Course[] = courses.filter(course => this.hasCourse(course));
            newCourses.forEach(course => {
                this.notify.notify(course.shortname, 
                    ":tada: Es wurde ein neuer Kurs angelegt: " + course.title, 
                    `https://stu-mgmt.uni-hildesheim.de/courses/${course.id}/assignments`, 
                    "Neuer Kurs");
                if (course.assignments && course.assignments.length > 0) {
                    
                    const diffAssignments: DiffAssignment[] = course.assignments.map(assignment => {
                        return {
                            old: {id: ""},
                            new: assignment
                        }
                    });

                    this.notifyAssignments(course, diffAssignments);
                }
            });

            oldCourses.forEach(course => {
                let assignments: DiffAssignment[] = [];
                course.assignments.forEach(assignment => {
                    const diffAssignment = this.updateAssignment(course, assignment);                    
                    if (diffAssignment) {
                        assignments.push(diffAssignment);               
                    }
                });                
                this.notifyAssignments(course, assignments);
            })

            courses.forEach(course => {
                this.addOrUpdateCourse(course);
            });
        });
    }

    notifyAssignments(course: Course, assignments: DiffAssignment[]) {
        
        assignments.forEach(diffAssignment => {
            let message = "";
            let title = "Hausaufgaben Status: " + diffAssignment.new.name;
            let color = "#339933";

            console.log(diffAssignment);
            const newEndDate = diffAssignment.new.endDate ? new Date(diffAssignment.new.endDate).toLocaleString('de-DE', { timeZone: 'CET' }) : undefined;
            const oldEndDate = diffAssignment.old && diffAssignment.old.endDate ? new Date(diffAssignment.old.endDate).toLocaleString('de-DE', { timeZone: 'CET' }) : newEndDate;

            if (!diffAssignment.old || diffAssignment.old.state !== diffAssignment.new.state) {
                if (diffAssignment.new.state === AssignmentState.IN_PROGRESS) {                    
                    if (newEndDate) {
                        message += `:pencil: **${diffAssignment.new.name}** kann nun bis spätestens __${newEndDate}__ bearbeitet werden.`
                    } else {
                        message += `:pencil: **${diffAssignment.new.name}** kann nun bearbeitet werden.`
                    }

                    if (diffAssignment.new.links && diffAssignment.new.links.length > 0) {
                        message += "\n"
                        diffAssignment.new.links.forEach(link => {
                            if (link.name.toLowerCase().includes("aufgabe") 
                                || link.name.toLowerCase().includes("übung")) {
                                message += `\n:file_folder: [${link.name}](${link.url})`
                            } else {
                                message += `\n:link: [${link.name}](${link.url})`
                            }
                        })
                    }
                } else if (diffAssignment.new.state === AssignmentState.IN_REVIEW) {
                    message += `:x: **${diffAssignment.new.name}** kann nun nicht mehr bearbeitet werden.`;
                } else if (diffAssignment.new.state === AssignmentState.EVALUATED) {
                    message += `:magic_wand: Die Ergebnisse für **${diffAssignment.new.name}** wurden hochgeladen.`;
                }
            } else {
                if (diffAssignment.new.state === AssignmentState.IN_PROGRESS 
                    && diffAssignment.old.endDate !== diffAssignment.new.endDate) {
                    message += `:warning: Für **${diffAssignment.new.name}** wurde das Abgabedatum von __${oldEndDate}__ zu __${newEndDate}__ geändert!`;
                    color = "#d67812";
                }
            }
            this.notify.notify(course.shortname, message, `https://stu-mgmt.uni-hildesheim.de/courses/${course.id}/assignments`, title, color);
            
        })
    }

    hasCourse = (course: Course) => {
        let foundCourse = db.get('courses')
            .find({id: course.id})
            .value();
        return foundCourse !== undefined;
    }

    getCourses = (): Course[] => {
        return db.get('courses').value()
    }

    getCourse(shortname: string) {
        return db.get('courses').find({shortname}).value();
    }

    addOrUpdateCourse(course: Course) {
        db.get('courses')
            .remove({id: course.id})
            .write();

        db.get('courses')
            .push(course)
            .write();        
    }

    updateAssignment(course: Course, newAssignment: Assignment): DiffAssignment {
        let foundCourse = db.get('courses')
            .find({id: course.id})
            .value();
        if (foundCourse === undefined) {
            return;
        }      
        
        let oldAssignment: Assignment = foundCourse.assignments.filter(assignment => assignment.id === newAssignment.id)[0];
        let oldAssignments: Assignment[] = foundCourse.assignments.filter(assignment => assignment.id !== newAssignment.id);
        let diffAssignment: DiffAssignment = {old: oldAssignment, new: newAssignment};
        
        oldAssignments.push(newAssignment);
        foundCourse.assignments = oldAssignments;
        this.addOrUpdateCourse(foundCourse);        
        return _.isEqual(diffAssignment.old, diffAssignment.new) ? undefined : diffAssignment;
    }

}

export default CoursesService;
