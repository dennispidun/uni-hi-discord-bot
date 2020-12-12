export interface Course {
    id: string;
    shortname?: string;
    semester?: string;
    title?: string;
    assignments?: Assignment[];
}

export interface Assignment {
    id: string,
    name?: string,
    state?: AssignmentState,
    type?: AssignmentType,
    startDate?: Date,
    endDate?: Date,
    links?: AssignmentLink[]
}

export interface AssignmentLink {
    url: string,
    name: string
}


export interface DiffAssignment {
    old: Assignment;
    new: Assignment;
}

export enum AssignmentState {
    INVISIBLE = "INVISIBLE", 
    CLOSED = "CLOSED", 
    IN_PROGRESS = "IN_PROGRESS", 
    IN_REVIEW = "IN_REVIEW", 
    EVALUATED = "EVALUATED"
}

export interface AssignmentStatus {

}

export enum AssignmentType {
    HOMEWORK = "HOMEWORK", 
    TESTAT = "TESTAT", 
    SEMINAR = "SEMINAR", 
    PROJECT = "PROJECT", 
    OTHER = "OTHER"
}