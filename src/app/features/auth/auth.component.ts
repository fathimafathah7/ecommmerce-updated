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

  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;
  showResetPassword = false;
  showResetConfirmPassword = false;

  togglePasswordVisibility(
    field: 'login' | 'register' | 'confirm' | 'reset' | 'resetConfirm'
  ) {
    if (field === 'login') {
      this.showLoginPassword = !this.showLoginPassword;
    } else if (field === 'register') {
      this.showRegisterPassword = !this.showRegisterPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    } else if (field === 'reset') {
      this.showResetPassword = !this.showResetPassword;
    } else {
      this.showResetConfirmPassword = !this.showResetConfirmPassword;
    }
  }

  showForgotPassword = false;
  forgotStep: 'request' | 'reset' = 'request';
  forgotEmailNotFound = false;
  private matchedUserId: number | string | null = null;
  emailTaken = false;

  private router = inject(Router);
  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);

  passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Letters and spaces only (so names like "Fathima Fathah" are allowed,
  // but "Fathima123" or "F@thima" are not).
  namePattern = /^[A-Za-z\s]+$/;

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
      Validators.required,
      Validators.minLength(2),
      Validators.pattern(this.namePattern)
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

 
  forgotForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ])
  });

 
  resetForm = new FormGroup({
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
    this.resetForgotPasswordState();
     this.emailTaken = false;
  }

  private resetForgotPasswordState() {
    this.showForgotPassword = false;
    this.forgotStep = 'request';
    this.forgotEmailNotFound = false;
    this.matchedUserId = null;
    this.forgotForm.reset();
    this.resetForm.reset();
    this.showResetPassword = false;
    this.showResetConfirmPassword = false;
  }

  openForgotPassword() {
    this.resetForgotPasswordState();
    this.showForgotPassword = true;
  }

  cancelForgotPassword() {
    this.resetForgotPasswordState();
  }

  submitForgotEmail() {

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.forgotEmailNotFound = false;

    const email = this.forgotForm.controls.email.value!;

    this.authService.findByEmail(email).subscribe({
      next: users => {

        if (users.length === 0) {
          this.forgotEmailNotFound = true;
          return;
        }
        this.matchedUserId = users[0].id!;
        this.forgotStep = 'reset';
      },
      error: () => {
        this.snackbar.error('Something went wrong. Please try again.');
      }
    });
  }

  showResetPasswordError(): boolean {
    const password = this.resetForm.controls.password.value ?? '';
    return password.length > 0 && this.resetForm.controls.password.invalid;
  }

  showResetConfirmPasswordError(): boolean {
    const confirm = this.resetForm.controls.confirmPassword;
    return confirm.touched &&
           (confirm.invalid || this.resetForm.hasError('passwordMismatch'));
  }

  submitNewPassword() {

    if (this.resetForm.invalid || !this.matchedUserId) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const newPassword = this.resetForm.controls.password.value!;

    this.authService.updatePassword(this.matchedUserId, newPassword).subscribe({
      next: () => {
        this.snackbar.success('Password reset successfully! Please sign in.');
        this.resetForgotPasswordState();
      },
      error: () => {
        this.snackbar.error('Could not reset your password. Please try again.');
      }
    });
  }

  showPasswordError(): boolean {
    const password = this.registerForm.controls.password.value ?? '';
    return password.length > 0 && this.registerForm.controls.password.invalid;
  }

  showConfirmPasswordError(): boolean {
    const confirm = this.registerForm.controls.confirmPassword;
    return confirm.touched &&
           (confirm.invalid || this.registerForm.hasError('passwordMismatch'));
  }

  showNameError(): boolean {
    const name = this.registerForm.controls.name;
    return (name.touched || name.dirty) && name.invalid;
  }

  nameErrorMessage(): string {
    const name = this.registerForm.controls.name;

    if (name.hasError('required')) {
      return 'Name is required.';
    }

    if (name.hasError('pattern')) {
      return 'Name can only contain letters.';
    }

    if (name.hasError('minlength')) {
      return 'Name must be at least 2 characters.';
    }

    return '';
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

          this.authService.setCurrentUser(user);
          this.snackbar.success(`Welcome back, ${user.name}!`);
          const destination = user.role === 'admin' ? '/admin' : '/';
          this.router.navigate([destination], { replaceUrl: true });

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

  const email = this.registerForm.controls.email.value!;

  this.authService.findByEmail(email).subscribe({
    next: existingUsers => {

      if (existingUsers.length > 0) {
        this.emailTaken = true;
        return;
      }

      this.emailTaken = false;
      const user = {
        name: this.registerForm.controls.name.value!,
        email,
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

    },
    error: () => {
      this.snackbar.error('Something went wrong. Please try again.');
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