// Routes = the URL map. Each line: method + path + middleware chain + handler.
// No logic here. Handlers are passed by reference (NO parentheses) — Express
// calls them later for each request.
import express from 'express';
import { validate } from '../../middleware/validate.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import { authController } from './auth.controller.js';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;