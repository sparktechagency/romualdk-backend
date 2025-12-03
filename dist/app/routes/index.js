"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_routes_1 = require("../modules/user/user.routes");
const auth_routes_1 = require("../modules/auth/auth.routes");
const rule_route_1 = require("../modules/rule/rule.route");
const faq_route_1 = require("../modules/faq/faq.route");
const review_route_1 = require("../modules/review/review.route");
const favouriteCar_route_1 = require("../modules/favouriteCar/favouriteCar.route");
const chat_routes_1 = require("../modules/chat/chat.routes");
const message_routes_1 = require("../modules/message/message.routes");
const car_routes_1 = require("../modules/car/car.routes");
const router = express_1.default.Router();
const apiRoutes = [
    {
        path: "/users",
        route: user_routes_1.UserRoutes
    },
    {
        path: "/auth",
        route: auth_routes_1.AuthRoutes
    },
    {
        path: "/rules",
        route: rule_route_1.RuleRoutes
    },
    {
        path: "/faqs",
        route: faq_route_1.FaqRoutes
    },
    {
        path: "/reviews",
        route: review_route_1.ReviewRoutes
    },
    {
        path: "/favourites",
        route: favouriteCar_route_1.FavouriteCarRoutes
    },
    {
        path: "/chats",
        route: chat_routes_1.ChatRoutes
    },
    {
        path: "/messages",
        route: message_routes_1.MessageRoutes
    },
    {
        path: "/cars",
        route: car_routes_1.CarRoutes
    }
];
apiRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
