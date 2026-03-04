# Resend Email Service Setup

This document explains how to set up Resend for email services in your Pairfect dating app.

## What is Resend?

Resend is a modern email API service that makes it easy to send emails from your application. It's a great alternative to traditional SMTP services like SendGrid, Mailgun, etc.

## Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a new account
3. Verify your email address

### 2. Verify Your Domain

1. In your Resend dashboard, go to "Domains"
2. Add your domain (e.g., `pairfect.com.ng`)
3. Add the DNS records provided by Resend to your domain's DNS settings
4. Wait for domain verification (usually takes a few minutes to a few hours)

### 3. Get Your API Key

1. Go to "API Keys" in your Resend dashboard
2. Create a new API key
3. Copy the API key

### 4. Configure Environment Variables

Add these to your `.env` file:

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

Replace:
- `re_your_api_key_here` with your actual Resend API key
- `noreply@yourdomain.com` with your verified domain email

### 5. Test the Setup

You can test the email functionality by:

1. Starting your backend server
2. Going to the forgot password page
3. Entering your email
4. Check if you receive the password reset email

## Email Templates

The app includes two email templates:

### Password Reset Email
- Sent when users request a password reset
- Contains a secure reset link
- Link expires in 1 hour
- Professional design with Pairfect branding

### Welcome Email
- Sent automatically when users register
- Contains a welcome message and call-to-action
- Helps with user onboarding

## Features

- **Professional Design**: Clean, modern email templates with your app's branding
- **Security**: Password reset links expire after 1 hour
- **Error Handling**: Graceful error handling that doesn't reveal user information
- **Async Processing**: Welcome emails are sent asynchronously to not slow down registration
- **Logging**: Comprehensive logging for debugging

## Benefits of Resend

- **Easy Setup**: Simple API, no complex SMTP configuration
- **Reliable Delivery**: High deliverability rates
- **Analytics**: Built-in email analytics and tracking
- **Templates**: Easy-to-use email templates
- **Developer-Friendly**: Great documentation and SDKs

## Troubleshooting

### Email Not Sending
1. Check your API key is correct
2. Verify your domain is properly configured
3. Check the server logs for error messages

### Domain Verification Issues
1. Ensure all DNS records are added correctly
2. Wait for DNS propagation (can take up to 24 hours)
3. Contact Resend support if issues persist

### Rate Limits
- Free tier: 100 emails per day
- Check your Resend dashboard for current limits
- Upgrade to paid plan for higher limits

## Production Considerations

1. **Domain Verification**: Always use a verified domain in production
2. **API Key Security**: Never commit API keys to version control
3. **Error Monitoring**: Set up error monitoring for email failures
4. **Analytics**: Monitor email delivery rates and user engagement

## Migration from SMTP

The app has been migrated from nodemailer/SMTP to Resend. The old SMTP configuration is kept for reference but is deprecated.

If you need to switch back to SMTP for any reason, you can:
1. Remove the Resend configuration
2. Set up the SMTP environment variables
3. Revert the authController changes

However, Resend is recommended for better reliability and easier setup.
