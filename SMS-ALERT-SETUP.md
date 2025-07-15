# SMS Alert Setup Guide - Auto Audit Pro Monitoring

## 🚨 SMS Alerts for Critical Issues

The monitoring system can send **instant SMS alerts** when critical (RED) issues occur with dealership websites!

## What Triggers SMS Alerts?

Only **🔴 RED ALERTS** trigger SMS notifications:
- Website completely down
- SSL certificate expired  
- Contact forms broken
- Zero inventory showing
- Server errors (500+)
- Load time over 10 seconds

## How to Enable SMS Alerts

### Option 1: Twilio (Professional SMS Service)

1. **Sign up for Twilio** (free trial available)
   - Go to https://www.twilio.com
   - Create account (you get $15 free credit)
   - Get your credentials:
     - Account SID
     - Auth Token
     - Phone Number

2. **Add to your `.env` file:**
   ```
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Add phone numbers in monitoring:**
   - When adding a website to monitor
   - Enter the alert phone number
   - Make sure "SMS alerts" is enabled

### Option 2: Email-to-SMS Gateway (Free)

Most carriers offer email-to-SMS gateways:

**US Carriers:**
- AT&T: `number@txt.att.net`
- Verizon: `number@vtext.com`
- T-Mobile: `number@tmomail.net`
- Sprint: `number@messaging.sprintpcs.com`

**Example:** For phone 555-123-4567 on Verizon:
- Use email: `5551234567@vtext.com`
- Enter this as the "Alert Email" when setting up monitoring

## Testing SMS Alerts

1. Add a test website with an invalid URL (like `https://this-will-fail-12345.com`)
2. Click "Check Now" 
3. You should receive an SMS within seconds!

## SMS Alert Format

```
🔴 CRITICAL Website Alert - ABC Motors

CRITICAL: Website is unreachable - customers cannot access your site!

Check dashboard for details: http://localhost:3002/monitoring
```

## Cost Considerations

- **Twilio**: ~$0.0075 per SMS (less than 1 cent)
- **Email-to-SMS**: Free but less reliable
- Only RED alerts trigger SMS (to avoid spam)

## Setting Alert Preferences

When adding a website to monitor, you can set:
- **Email alerts**: For all alert levels
- **SMS alerts**: Only for critical RED alerts
- **Check frequency**: How often to check (15-120 minutes)

## iMessage Support

For iMessage specifically:
- Use email-to-SMS with an iPhone number
- Or use Twilio (works with all phones including iPhones)
- iMessage will receive it as a regular text

## Quick Setup Checklist

- [ ] Sign up for Twilio (or use email-to-SMS)
- [ ] Add credentials to `.env` file
- [ ] Restart the server
- [ ] Add website with phone number
- [ ] Test with a fake URL to verify

That's it! You'll now get instant SMS alerts for critical website issues!