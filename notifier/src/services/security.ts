import { singleton } from "tsyringe";
import FileSync from 'lowdb/adapters/FileSync';
import low from 'lowdb';

type Schema = {
    authorized_keys: string[];
};

const adapter = new FileSync<Schema>('api-tokens.db.json')
const db = low(adapter)

@singleton()
export default class ApiSecurity {
    constructor() {
        db.defaults({ authorized_keys: []}).write();
    }

    isAuthorized(key: string): boolean {
        return db.get("authorized_keys").value().includes(key);
    }
}