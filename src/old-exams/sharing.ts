import FileSync from "lowdb/adapters/FileSync";
import low from 'lowdb';
import { Dropbox } from "dropbox";

import cron from "node-cron";

type Schema = {
    links: {
        name: string,
        link: string,
        expires: number
    }[];
};

const adapter = new FileSync<Schema>('exam-links.db.json')
const db = low(adapter);
class SharingService {
    dbx: Dropbox;
    constructor() {
        db.defaults({ links: [] }).write();
        this.dbx = new Dropbox({ accessToken: process.env.DBX_TOKEN });

        cron.schedule('* * * * *', () => {
            let links = db.get("links").value();
            const now = Date.now();
        
            links.filter(link => link.expires < now)
                .forEach(link => {
                    try {
                        this.dbx.sharingRevokeSharedLink({
                            url: link.link
                        });
                    }catch (e) {
                            
                    }
                    
                    db.get("links").remove({link : link.link}).write();
                });
        });
    }

    addShareLink(name: string, link: string) {
        db.get("links").remove({link}).write();
    
        db.get("links").push({
            name,
            link,
            expires: Date.now() + 60*60*1000*24*7
        }).write();
    }

    async getLink(name: string): Promise<any> {
        let link = db.get("links").find({name}).value();
        if (!link) {
            try {
                const links = (await this.dbx.sharingListSharedLinks({})).result
                    .links.filter(foundLink => foundLink.name.includes(name)
                        || name.includes(foundLink.name));
                
                if (links.length > 0) {
                    this.addShareLink(name, links[0].url);
                    return await this.getLink(name);
                }
                
            } catch (e) {}
            return undefined;
        }

        return link;
    }
}
export default SharingService;
