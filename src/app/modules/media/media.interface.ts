export enum MEDIA_TYPE {
  BANNER = "BANNER",
<<<<<<< HEAD
  FEED = "FEED",
=======
  FEED = "FEED"
>>>>>>> clean-payment
}

export interface IMedia extends Document {
  name: string;
  image: string;
  status: boolean;
  type: MEDIA_TYPE;
  description?: string;
<<<<<<< HEAD
}
=======
}
>>>>>>> clean-payment
