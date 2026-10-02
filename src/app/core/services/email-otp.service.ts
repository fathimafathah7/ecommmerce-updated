import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

/**
 * Wraps EmailJS so the rest of the app never touches the SDK directly.
 * Fill in the three constants below from your EmailJS dashboard
 * (Email Services / Email Templates / Account > General).
 */
@Injectable({
  providedIn: 'root'
})
export class EmailOtpService {

  private readonly serviceId = 'service_iz8mbke';
  private readonly templateId = 'template_o09ke8h';
  private readonly publicKey = '0e0N99agpAhp91sK0';

  /** Generates a random 6-digit numeric code, e.g. "042817". */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /** Sends the OTP to the given email via the configured EmailJS template. */
  sendOtp(toEmail: string, toName: string, otp: string): Promise<void> {
    return emailjs.send(
      this.serviceId,
      this.templateId,
      {
        to_email: toEmail,
        to_name: toName,
        otp_code: otp
      },
      this.publicKey
    ).then(() => undefined);
  }
}