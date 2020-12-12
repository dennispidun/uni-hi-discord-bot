import { Request, Response } from "express";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import { container } from "tsyringe";
import ApiSecurity from "../services/security";

@Middleware({ type: 'before' })
export class AuthentificationMiddleware implements ExpressMiddlewareInterface {
    use (request: Request, response: Response, next: () => any) {
        const apiSecurity = container.resolve(ApiSecurity);
        let hasAuthHeader = !!request.rawHeaders.find(header => header === 'api-token');
        if (!hasAuthHeader || !apiSecurity.isAuthorized(request.headers['api-token'] as string)) {
            response.status(401).send("Auth Key is not valid: please provide 'api-token' as header.");
        } else {
            next();
        }
    }
}