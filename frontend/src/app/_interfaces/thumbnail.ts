/**
 * This is used in the home and profile components to represent a photo thumbnail and its current info in relation to
 * the current user.
 */
export interface Thumbnail {
  _id: string,
  base64Thumbnail: string,
  name: string,
  description: string,
  flags: {
    isPhotoLiked: boolean, // if current user has liked photo
    isPhotoFavourited: boolean, // if current has favourited photo
    isRequestInProgress: boolean // check if request is in progress (so new requests can be temporarily blocked)
  }
}
