import { Router } from '@angular/router';
import { Component, OnDestroy, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { EmailOtpService } from '../../core/services/email-otp.service';
import { User } from '../../core/models/user.model';

const OTP_DURATION_SECONDS = 180; // 3 minutes

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnDestroy {

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

  // --- OTP registration state ---
  registerStep: 'form' | 'otp' = 'form';
  sendingOtp = false;
  verifyingOtp = false;
  otpError = '';
  otpTimeLeft = OTP_DURATION_SECONDS;

  private generatedOtp: string | null = null;
  private pendingUser: User | null = null;
  private timerSubscription?: Subscription;

  otpControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{6}$/)
  ]);

  private router = inject(Router);
  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private emailOtpService = inject(EmailOtpService);

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
    this.resetOtpState();
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

  // --- Registration, step 1: validate + check email, then send OTP ---
  register() {

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const email = this.registerForm.controls.email.value!;

    this.sendingOtp = true;

    this.authService.findByEmail(email).subscribe({
      next: existingUsers => {

        if (existingUsers.length > 0) {
          this.emailTaken = true;
          this.sendingOtp = false;
          return;
        }

        this.emailTaken = false;

        this.pendingUser = {
          name: this.registerForm.controls.name.value!,
          email,
          password: this.registerForm.controls.password.value!
        };

        this.sendOtpEmail(this.pendingUser);
      },
      error: () => {
        this.sendingOtp = false;
        this.snackbar.error('Something went wrong. Please try again.');
      }
    });
  }

  private sendOtpEmail(user: User) {

    const otp = this.emailOtpService.generateOtp();

    this.emailOtpService.sendOtp(user.email, user.name, otp).then(
      () => {
        this.generatedOtp = otp;
        this.sendingOtp = false;
        this.registerStep = 'otp';
        this.otpControl.reset();
        this.otpError = '';
        this.startOtpTimer();
        this.snackbar.success(`A verification code was sent to ${user.email}.`);
      },
      () => {
        this.sendingOtp = false;
        this.snackbar.error('Could not send the verification email. Please try again.');
      }
    );
  }

  private startOtpTimer() {

    this.timerSubscription?.unsubscribe();
    this.otpTimeLeft = OTP_DURATION_SECONDS;

    this.timerSubscription = interval(1000).subscribe(() => {

      this.otpTimeLeft--;

      if (this.otpTimeLeft <= 0) {
        this.otpTimeLeft = 0;
        this.timerSubscription?.unsubscribe();
      }
    });
  }

  get otpExpired(): boolean {
    return this.otpTimeLeft <= 0;
  }

  /** Formats the remaining seconds as mm:ss for the countdown display. */
  get otpTimerDisplay(): string {
    const minutes = Math.floor(this.otpTimeLeft / 60);
    const seconds = this.otpTimeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // --- Registration, step 2: verify the code, then actually create the account ---
  verifyOtp() {

    if (this.otpControl.invalid) {
      this.otpControl.markAsTouched();
      return;
    }

    if (this.otpExpired) {
      this.otpError = 'This code has expired. Please request a new one.';
      return;
    }

    if (this.otpControl.value !== this.generatedOtp) {
      this.otpError = 'Incorrect code. Please check and try again.';
      return;
    }

    if (!this.pendingUser) {
      this.snackbar.error('Something went wrong. Please start over.');
      this.resetOtpState();
      return;
    }

    this.otpError = '';
    this.verifyingOtp = true;

    this.authService.register(this.pendingUser).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.snackbar.success('Account created successfully! Please sign in.');
        this.isLogin = true;
        this.registerForm.reset();
        this.resetOtpState();
      },
      error: () => {
        this.verifyingOtp = false;
        this.snackbar.error('Could not create your account. Please try again.');
      }
    });
  }

  resendOtp() {

    if (!this.otpExpired || !this.pendingUser) {
      return;
    }

    this.sendingOtp = true;
    this.sendOtpEmail(this.pendingUser);
  }

  /** "Back" from the OTP screen to the registration form, discarding the code. */
  backToRegisterForm() {
    this.resetOtpState();
  }

  private resetOtpState() {
    this.registerStep = 'form';
    this.generatedOtp = null;
    this.pendingUser = null;
    this.otpError = '';
    this.otpControl.reset();
    this.timerSubscription?.unsubscribe();
    this.otpTimeLeft = OTP_DURATION_SECONDS;
  }

  ngOnDestroy() {
    this.timerSubscription?.unsubscribe();
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