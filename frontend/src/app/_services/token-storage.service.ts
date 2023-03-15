import {Injectable} from '@angular/core';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  signOut(): void {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Saves token to localStorage.
   *
   * @param token token to save.
   */
  public saveToken(token: string): void {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Gets token from localStorage.
   *
   * @returns token string if existent; else null.
   */
  public getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Saves current user to localStorage.
   *
   * @param user current user to save.
   */
  public saveUser(user: any): void {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Get current user from localStorage.
   *
   * @returns the object corresponding to the user JSON stored. {} if user non existent.
   */
  public getUser(): any {
    const user = window.localStorage.getItem(USER_KEY);

    if (user) {
      return JSON.parse(user);
    }

    return undefined;
  }
}
