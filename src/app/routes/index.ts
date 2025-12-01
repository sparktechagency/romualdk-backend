import express from 'express';
import { UserRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { RuleRoutes } from '../modules/rule/rule.route';
import { FaqRoutes } from '../modules/faq/faq.route';
import { ReviewRoutes } from '../modules/review/review.route';
const router = express.Router();

const apiRoutes = [
    {
        path: "/users",
        route: UserRoutes
    },
    {
        path: "/auth",
        route: AuthRoutes
    },
    {
        path: "/rules",
        route: RuleRoutes
    },
    {
        path: "/faqs",
        route: FaqRoutes
    },
    {
        path: "/reviews",
        route: ReviewRoutes
    }
]

apiRoutes.forEach(route => router.use(route.path, route.route));
export default router;