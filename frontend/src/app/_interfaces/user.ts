export interface User {
  _id: string;
  username: string;
  password: string;
  photoList: string[];
  likedPhotoList: string[];
  favouritePhotoList: string[];
}
