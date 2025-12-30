// -------- Price Calculation ----------
// const calculatePrice = (fromDate: string, toDate: string) => {
//   const from = new Date(fromDate);
//   const to = new Date(toDate);

//   const diffMs = to.getTime() - from.getTime();
//   if (diffMs <= 0) return { days: 0, hours: 0 };

//   const totalHours = Math.floor(diffMs / (1000 * 60 * 60));

//   const days = Math.floor(totalHours / 24);
//   const hours = totalHours % 24;

//   return { days, hours, totalHours };
// };

// export { calculatePrice };

interface IPriceCalculation {
  billableDays: number;
  totalHours: number;
}

const calculatePrice = (fromDate: string, toDate: string): IPriceCalculation => {
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();

  const diffMs = to - from;
  if (diffMs <= 0) {
    return { billableDays: 0, totalHours: 0 };
  }

  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));

  const fullDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  let billableDays = fullDays;

  if (remainingHours > 0 && remainingHours <= 12) {
    billableDays += 0.5;
  } else if (remainingHours > 12) {
    billableDays += 1;
  }

  return {
    billableDays,
    totalHours,
  };
};

export { calculatePrice };


