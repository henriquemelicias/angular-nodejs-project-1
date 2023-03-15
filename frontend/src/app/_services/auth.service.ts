import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {SharedService} from "./shared.service";

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  AUTH_URL;

  constructor(private http: HttpClient, private sharedService: SharedService) {
    this.AUTH_URL = sharedService.BACKEND_API + '/auth';
  }

  /**
   * Sends user login info to backend.
   *
   * @param username username.
   * @param password password.
   */
  login(username: string, password: string): Observable<any> {
    return this.http.post(this.AUTH_URL + '/signin', {username, password}, httpOptions);
  }

  /**
   * Sends user register info to backend.
   *
   * @param username username.
   * @param password password.
   */
  register(username: string, password: string): Observable<any> {
    return this.http.post(this.AUTH_URL + '/signup', {username, password}, httpOptions);
  }
}
