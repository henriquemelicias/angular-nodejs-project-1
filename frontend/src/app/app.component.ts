import {Component, OnInit} from '@angular/core';
import {TokenStorageService} from './_services/token-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  navbarProfileItemName ?: string;

  constructor(private tokenStorageService: TokenStorageService) {
  }

  /**
   * Checks if user is logged in, and get his token.
   */
  ngOnInit(): void {
    // if user logged in, get user token
    this.isLoggedIn = !!this.tokenStorageService.getToken();

    if (this.isLoggedIn) {
      const user = this.tokenStorageService.getUser();

      // username on navbar profile item
      if (user && user.username.length > 45) {
        this.navbarProfileItemName = user.username.substring(0, 45) + "...";
      } else {
        this.navbarProfileItemName = user.username;
      }
    }
  }

  /**
   * Logouts user in current session.
   */
  logout(): void {
    this.tokenStorageService.signOut();
    window.location.reload();
  }
}
