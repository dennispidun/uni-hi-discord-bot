import { createExpressServer } from "routing-controllers";
import { autoInjectable } from "tsyringe";
import DiscordController from "./controller/discord.controller";
import Discord from "./discord";

@autoInjectable()
class ExpressApp {

    private app;

    constructor(private discord?: Discord) {
        this.app = createExpressServer({
            routePrefix: '/api/notify',
            development: false,
            defaults: {
                nullResultCode: 404,
                undefinedResultCode: 204,
                paramOptions: {
                    required: true,
                },
            },
            middlewares: [__dirname + '/middlewares/**/*.js'],
            controllers: [__dirname + '/controller/**/*.js'], // we specify controllers we want to use
        });
    }

    init () {
        this.app.listen(8090, () => {
            console.log("listening on *:8090");
        })
    }

}

export default ExpressApp;