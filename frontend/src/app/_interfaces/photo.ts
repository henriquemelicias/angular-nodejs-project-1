export interface Photo {
  _id: string;
  base64: string; // photo image base64
  base64Thumbnail: string;
  name: string;
  description: string;
  likes: number;
}
