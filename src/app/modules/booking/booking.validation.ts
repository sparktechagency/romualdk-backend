// import { z } from 'zod';

// export const createBookingSchema = z.object({
//   carId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Car ID"),
//   fromDate: z.string().datetime({ message: "Invalid fromDate format" }),
//   toDate: z.string().datetime({ message: "Invalid toDate format" }),
//   location: z.string().min(3, "Location too short"),
//   type: z.enum(['withDriver', 'withoutDriver'])
// }).refine((data) => new Date(data.toDate) > new Date(data.fromDate), {
//   message: "toDate must be after fromDate",
//   path: ["toDate"]
// });

// export type CreateBookingInput = z.infer<typeof createBookingSchema>;