import { ValidationError } from 'class-validator';
import { Request } from 'express';
import { Middleware, ExpressErrorMiddlewareInterface, BadRequestError } from 'routing-controllers';

@Middleware({ type: 'after' })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, request: Request, response: any, next: (err: any) => any) {

      if (error instanceof BadRequestError) {
          console.log("Bad Request:", request.route.path);
          error = undefined;
      }

      next(error);
  }
}