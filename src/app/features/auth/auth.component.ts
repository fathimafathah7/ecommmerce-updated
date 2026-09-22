import { Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {

  isLogin = true;
  private router=inject(Router)

  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);


  passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required,
      Validators.pattern(this.passwordPattern)
    ])
  });

  registerForm = new FormGroup({
    name: new FormControl('', [
      Validators.required
    ]),

    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required,
      Validators.pattern(this.passwordPattern)
    ]),

    confirmPassword: new FormControl('', [
      Validators.required
    ])
  }, { validators: passwordsMatchValidator });

  switchMode() {
    this.isLogin = !this.isLogin;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  showPasswordError(): boolean {

    const password =
      this.registerForm.controls.password.value ?? '';

    return password.length > 0 &&
           this.registerForm.controls.password.invalid;
  }

  showConfirmPasswordError(): boolean {
    const confirm = this.registerForm.controls.confirmPassword;
    return confirm.touched &&
           (confirm.invalid || this.registerForm.hasError('passwordMismatch'));
  }

  login() {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.controls.email.value!;
    const password = this.loginForm.controls.password.value!;

    this.authService.login(email, password).subscribe({
      next: users => {

        if (users.length > 0) {

          const user = users[0];

          // Persist and broadcast the login so every part of the app
          // (navbar, cart, wishlist) reacts immediately.
          this.authService.setCurrentUser(user);

          this.snackbar.success(`Welcome back, ${user.name}!`);

          this.router.navigate(['/']);

        } else {
          this.snackbar.error('Invalid email or password.');
        }
      },
      error: () => {
        this.snackbar.error('Something went wrong while signing in. Please try again.');
      }
    });
  }

  register() {

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const user = {
      name: this.registerForm.controls.name.value!,
      email: this.registerForm.controls.email.value!,
      password: this.registerForm.controls.password.value!
    };

    this.authService.register(user).subscribe({
      next: () => {

        this.snackbar.success('Account created successfully! Please sign in.');

        this.isLogin = true;
        this.registerForm.reset();

      },
      error: () => {
        this.snackbar.error('Could not create your account. Please try again.');
      }
    });
  }

}

function passwordsMatchValidator(group: AbstractControl) {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

