import axios from "axios";
const axiosApiInstance = axios.create();
import store from "store";
import { Assignment, AssignmentType, Course } from "./stmgmt-course.model";

import cron from "node-cron";

const AUTH_API_BASE = "https://authenticate.sse.uni-hildesheim.de/api/v1";
const STUMGMT_API_BASE = "https://authenticate.sse.uni-hildesheim.de/stmgmt";
const API = {
  authenticate: {
    base: AUTH_API_BASE + "/authenticate",
    userId: STUMGMT_API_BASE + "/auth/whoAmI"
  },
  courses: {
    base: (userId: string) => STUMGMT_API_BASE + `/users/${userId}/courses`,
    assignments: (courseId: string) => STUMGMT_API_BASE + `/courses/${courseId}/assignments`
  }
};

class SparkyAuth {

  constructor(credentials: SparkyCredentials) {
    console.log("login");
    this.login(credentials).then(() => {
      axiosApiInstance.interceptors.request.use((config) => {
        const token = store.get("token");
        config.headers = { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
        return config;
      });

      axiosApiInstance.interceptors.response.use((response) => {
          return response;
      }, (error) => {
        if (401 === error.response.status) {
          this.login(credentials).then(() => {});
        } else {
          return Promise.reject(error);
        }

        error.config.__isRetryRequest = true
        return axiosApiInstance(error.config)
      });

    });
  }

  isAuthenticated = async () => {
    const result = (await axiosApiInstance.get(API.authenticate.userId));
    return result.status == 200;
  }

  private login = async (credentials: SparkyCredentials) => {
    const result = await axiosApiInstance.post(API.authenticate.base, credentials);
    const authToken = result.data.token.token;
    console.log("authToken: ", authToken);
    const resultWhoAmI = await axiosApiInstance.get(API.authenticate.userId, { headers : {
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json'
    }});
    store.set("token", authToken); 
    store.set("userid", resultWhoAmI.data.id); 
    console.log("resultWhoAmI.data.id: ", resultWhoAmI.data.id);
  }

  getUserId() {
    return store.get("userid");
  }
  
  printAuthCheck = async () => {
    const result = (await axiosApiInstance.get(API.authenticate.userId)).data;
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

    return new Promise<Assignment[]>(resolve => {
      resolve(assignments.filter(ass => ass.type == AssignmentType.HOMEWORK));
    });
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