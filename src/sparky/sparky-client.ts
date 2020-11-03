import axios from "axios";
const axiosApiInstance = axios.create();
import store from "store";
import { isDate } from "util";
import { Assignment, Course } from "./stmgmt-course.model";

const AUTH_API_BASE = "https://authenticate.sse.uni-hildesheim.de/api/v1";
const STUMGMT_API_BASE = "https://authenticate.sse.uni-hildesheim.de/stmgmt";
const API = {
  authenticate: {
    base: AUTH_API_BASE + "/authenticate",
    check: AUTH_API_BASE + "/authenticate/check",
    userId: STUMGMT_API_BASE + "/auth/loginWithToken"
  },
  courses: {
    base: (userId: string) => STUMGMT_API_BASE + `/users/${userId}/courses`,
    assignments: (courseId: string) => STUMGMT_API_BASE + `/courses/${courseId}/assignments`
  }
};

class SparkyAuth {

  constructor(credentials: SparkyCredentials) {
    this.login(credentials).then(() => {
      axiosApiInstance.interceptors.request.use((config) => {
        const token = store.get("token");
        config.headers = { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
        return config;
      });
    });
  }

  isAuthenticated = async () => {
    const result = (await axiosApiInstance.get(API.authenticate.check));
    return result.status == 200;
  }

  private login = async (credentials: SparkyCredentials) => {
    const result = await axiosApiInstance.post(API.authenticate.base, credentials);
    const authToken = result.data.token.token;

    const resultUserToken = await axiosApiInstance.post(API.authenticate.userId, {token: authToken});
    store.set("token", resultUserToken.data.accessToken); 
    store.set("userid", resultUserToken.data.user.id); 
  }

  getUserId() {
    return store.get("userid");
  }
  
  printAuthCheck = async () => {
    const result = (await axiosApiInstance.get(API.authenticate.check)).data;
    console.log(result);
  }

  getAssignments = async(courseId: string): Promise<Assignment[]> => {
    const apiUrl = API.courses.assignments(courseId);    
    const result = (await axiosApiInstance.get<Course[]>(apiUrl)).data;
    let assignments: Assignment[] = []

    result.forEach((element: any) => {
        assignments.push({
          id: element.id, 
          name: element.name,
          state: element.state,
          type: element.type,
          startDate: element.startDate,
          endDate: element.endDate,
          links: element.links
        })
    });

    return new Promise<Assignment[]>(resolve => resolve(assignments));
  }

  getCourses = async (): Promise<Course[]> => {
    const apiUrl = API.courses.base(this.getUserId());    
    const result = (await axiosApiInstance.get<Course[]>(apiUrl)).data;
    let courses: Course[] = []

    result.forEach((element: any) => {
        courses.push({
          id: element.id, 
          shortname: element.shortname, 
          semester: element.semester, 
          title: element.title
        })
    });

    for(let course of courses) {
      course.assignments = await this.getAssignments(course.id);
    }

    return new Promise<Course[]>(resolve => resolve(courses));
  }
}

interface SparkyCredentials {
    username: string;
    password: string;
}
 
export default SparkyAuth;