import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {Photo} from '../_interfaces/photo';
import {Observable} from 'rxjs';
import {SharedService} from "./shared.service";

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  PHOTO_URL;

  constructor(private http: HttpClient, private sharedService: SharedService) {
    this.PHOTO_URL = sharedService.BACKEND_API + '/photo';
  }

  /**
   * Add new photo to the server.
   *
   * @param photo Photo to add.
   */
  addPhoto(photo: { newPhoto: { base64: string; name: string; description: string }; username: any }): Observable<any> {
    return this.http.post(this.PHOTO_URL, photo, {
      reportProgress: true,
      observe: 'events',
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    });
  }

  /**
   * Get recent photos id and indices of entry (most recent index = 0 ).
   */
  getRecentPhotosId(): Observable<{ _id: string; index: number }[]> {
    const url = `${(this.PHOTO_URL)}/info/recent`;
    return this.http.get<{ _id: string; index: number }[]>(url, httpOptions);
  }

  /**
   * Get the most liked photos id and indices of entry (most liked index = 0 ).
   */
  getMostLikedPhotosId(): Observable<{ _id: string; index: number }[]> {
    const url = `${(this.PHOTO_URL)}/info/liked`;
    return this.http.get<{ _id: string; index: number; }[]>(url, httpOptions);
  }

  /**
   * Get photo with id.
   *
   * @param id identifier of the photo to get.
   */
  getPhoto(id: string): Observable<Photo> {
    const url = `${(this.PHOTO_URL)}/${id}`;
    return this.http.get<Photo>(url, httpOptions);
  }

  /**
   * Get photo thumbnail with id.
   *
   * @param id identifier of the photo to get.
   */
  getPhotoThumbnail(id: string): Observable<{ base64Thumbnail: string, name: string, description: string }> {
    const url = `${(this.PHOTO_URL)}/${id}/thumbnail`;
    return this.http.get<{ base64Thumbnail: string, name: string, description: string }>(url, httpOptions);
  }

  /**
   * Deletes photo by id.
   *
   * @param id id of the photo to be deleted.
   */
  deletePhoto(id: string): Observable<{ message: string }> {
    const url = `${(this.PHOTO_URL)}/${id}`;
    return this.http.delete<{ message: string }>(url, httpOptions);
  }

  /**
   * Change photo likes number by +1 or -1 and adds photo id to user's likedPhotoList
   *
   * @param id id of the photo to change number of likes.
   * @param userId userId to change likedPhotoList
   * @param isIncremented {@code true} to increment number of likes by 1; else decrement by 1.
   * @param likedPhotoList likedPhotoList to update
   */
  changePhotoLikes(id: string, userId: string, isIncremented: boolean, likedPhotoList: string[]): Observable<void> {
    const url = `${(this.PHOTO_URL)}/${id}`;
    return this.http.put<void>(url, {likeChange: isIncremented ? 1 : -1, userId: userId, likedPhotoList: likedPhotoList}, httpOptions);
  }
}
