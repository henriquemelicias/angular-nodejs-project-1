import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../_services/auth.service';
import {TokenStorageService} from '../_services/token-storage.service';
import {UserService} from "../_services/user.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: any = {
    username: null,
    password: null
  };

  // is user logged in
  isLoggedIn = false;

  // component wise error message
  errorMessage ?: string;

  // other info message
  infoMessage ?: string;

  constructor(private authService: AuthService,
              private tokenStorage: TokenStorageService,
              private userService: UserService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit(): void {

    // check if user session token has expired
    this.route.queryParams
      .subscribe(params => {
        if (params.expired !== undefined && params.expired === 'true') {
          this.infoMessage = 'Session expired! Please login again.';
        }
      });

    // check if user just registered and route has registered param
    this.route.queryParams
      .subscribe(params => {
        if (params.registered !== undefined && params.registered === 'true') {
          this.infoMessage = 'Registration Successful. Please Login!';
        }
      });

    // check if user is logged in
    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
    }
  }

  /**
   * On user login info form submit, tries to login user.
   */
  onSubmit(): void {
    const {username, password} = this.form;

    // sends user login info to backend
    this.authService.login(username, password).subscribe(
      data => {
        this.tokenStorage.saveToken(data.accessToken);
        this.tokenStorage.saveUser(data);

        this.isLoggedIn = true;

        // get user and check number of photos
        this.userService.getUserByUsername(username).subscribe(user => {
          const numberOfPhotos = user.photoList.length;

          if (user.photoList.length > 0) {
            this.router.navigate(['/profile']).then(() => window.location.reload());
          } else {
            this.router.navigate(['/home']).then(() => window.location.reload());
          }

        });
      },
      err => {
        this.errorMessage = err.error.message;
      });
  }
}
