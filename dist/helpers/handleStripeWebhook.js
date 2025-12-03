"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("colors"));
const handlers_1 = require("../handlers");
const http_status_codes_1 = require("http-status-codes");
const logger_1 = require("../shared/logger");
const config_1 = __importDefault(require("../config"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const stripe_1 = __importDefault(require("../config/stripe"));
const handleStripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract Stripe signature and webhook secret
    const signature = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.webhookSecret;
    let event;
    // Verify the event signature
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Webhook signature verification failed. ${error}`);
    }
    // Check if the event is valid
    if (!event) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid event received!');
    }
    // Extract event data and type
    const data = event.data.object;
    const eventType = event.type;
    // Handle the event based on its type
    try {
        switch (eventType) {
            case 'customer.subscription.created':
                yield (0, handlers_1.handleSubscriptionCreated)(data);
                break;
            case 'customer.subscription.updated':
                yield (0, handlers_1.handleSubscriptionUpdated)(data);
                break;
            case 'customer.subscription.deleted':
                yield (0, handlers_1.handleSubscriptionDeleted)(data);
                break;
            case 'account.updated':
                yield (0, handlers_1.handleAccountUpdatedEvent)(data);
                break;
            default:
                logger_1.logger.warn(colors_1.default.bgGreen.bold(`Unhandled event type: ${eventType}`));
        }
    }
    catch (error) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error handling event: ${error}`);
    }
    res.sendStatus(200);
});
exports.default = handleStripeWebhook;
