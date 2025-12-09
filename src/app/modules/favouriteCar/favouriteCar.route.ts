import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { FavouriteCarControllers } from "./favouriteCar.controller";

<<<<<<< HEAD
const router = express.Router();

router.post(
  "/toggle",
  auth(USER_ROLES.USER),
  FavouriteCarControllers.toggleFavourite,
=======

const router = express.Router();

router.post(
    "/toggle",
    auth(USER_ROLES.USER),
    FavouriteCarControllers.toggleFavourite,
>>>>>>> clean-payment
);

router.get("/", auth(USER_ROLES.USER), FavouriteCarControllers.getFavourite);

router.get(
<<<<<<< HEAD
  "/:bookmarkId",
  auth(USER_ROLES.USER),
  FavouriteCarControllers.getSingleFavourite,
);

router.delete(
  "/:referenceId",
  auth(USER_ROLES.USER),
  FavouriteCarControllers.deleteFavourite,
=======
    "/:bookmarkId",
    auth(
        USER_ROLES.USER
    ),
    FavouriteCarControllers.getSingleFavourite,
);

router.delete(
    "/:referenceId",
    auth(USER_ROLES.USER),
    FavouriteCarControllers.deleteFavourite,
>>>>>>> clean-payment
);

export const FavouriteCarRoutes = router;
