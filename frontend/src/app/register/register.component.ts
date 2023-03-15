import {Component, OnInit} from '@angular/core';
import {AuthService} from '../_services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  form: any = {
    username: null,
    password: null
  };

  // was registration successful
  isSuccessful = false;

  // compoent wise error message
  errorMessage ?: string;

  constructor(private authService: AuthService, private router: Router) {
  }

  ngOnInit(): void {
  }

  hasLowerCaseLetter(pass: string): boolean {
    return !!pass.match('[a-z]');
  }

  hasUpperCaseLetter(pass: string): boolean {
    return !!pass.match('[A-Z]');
  }

  hasDigit(pass: string): boolean {
    return !!pass.match('[0-9]');
  }

  onSubmit(): void {
    const {username, password} = this.form;

    this.authService.register(username, password).subscribe(
      data => {
        this.isSuccessful = true;

        // goto login page
        this.router.navigate(['/login'], {queryParams: { registered: 'true' } });
      },
      err => {
        this.errorMessage = err.error.message;
      }
    );
  }
}
