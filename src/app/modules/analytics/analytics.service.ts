import { STATUS, USER_ROLES } from "../../../enums/user"
import { CAR_VERIFICATION_STATUS } from "../car/car.interface"
import { Car } from "../car/car.model"
import { User } from "../user/user.model"

const statCountsFromDB = async () => {
    const [users, cars] = await Promise.all([
        await User.countDocuments({ verified: true, status: STATUS.ACTIVE, role: USER_ROLES.HOST || USER_ROLES.USER }),
        await Car.countDocuments({ verificationStatus: CAR_VERIFICATION_STATUS.APPROVED })
    ]);

    return {
        users,
        cars,
    }
}

export const AnalyticsServices = {
    statCountsFromDB,
}