import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

import {User} from '../_interfaces/user';
import {SharedService} from "./shared.service";

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class UserService {

  USER_URL;

  constructor(private http: HttpClient, private sharedService: SharedService) {
    this.USER_URL = sharedService.BACKEND_API + '/user'
  }

  /**
   * Get specific user information from backend.
   *
   * @param username username of the user to get.
   */
  getUserByUsername(username: string): Observable<any> {
    const url = `${(this.USER_URL)}/${username}`;
    return this.http.get(url, httpOptions);
  }

  /**
   * Updates user.
   *
   * @param user updated new user.
   */
  updateUser(user: User): Observable<any> {
    const url = `${(this.USER_URL)}`;
    return this.http.put(url, user, httpOptions);
  }
}
