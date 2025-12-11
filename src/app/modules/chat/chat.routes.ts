import { Router } from "express";
import { ChatController } from "./chat.controller";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";

const router = Router();

<<<<<<< HEAD
=======

>>>>>>> clean-payment
router.get(
  "/",
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
<<<<<<< HEAD
    USER_ROLES.HOST,
=======
    USER_ROLES.HOST
>>>>>>> clean-payment
  ),
  ChatController.getChats,
);

router.get(
  "/:chatId/images",
<<<<<<< HEAD
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.HOST,
=======
   auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.HOST
>>>>>>> clean-payment
  ),
  ChatController.getChatImages,
);

router.post(
  "/create-chat",
<<<<<<< HEAD
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.HOST,
=======
    auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.HOST
>>>>>>> clean-payment
  ),
  ChatController.createChat,
);

<<<<<<< HEAD
router.patch(
  "/mark-chat-as-read/:id",
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.HOST,
=======

router.patch(
  "/mark-chat-as-read/:id",
   auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.HOST
>>>>>>> clean-payment
  ),
  ChatController.markChatAsRead,
);

<<<<<<< HEAD
router.delete(
  "/delete/:chatId",
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.HOST,
=======

router.delete(
  "/delete/:chatId",
   auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.HOST
>>>>>>> clean-payment
  ),
  ChatController.deleteChat,
);

export const ChatRoutes = router;
