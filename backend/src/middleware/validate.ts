import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodType } from "zod";

function validate(zodSchema: ZodType) :RequestHandler{
    return function (req: Request, res: Response, next: NextFunction) {
        const result = zodSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                message: "Validation failed",
                errors: result.error.issues,
            });
            return;
        }
        req.body = result.data;
        next();
    };
}

export { validate };