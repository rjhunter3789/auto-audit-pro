/**
 * Notification Service
 * Handles sending alerts via email, SMS, and dashboard notifications
 */

const nodemailer = require('nodemailer');
let twilio;

try {
    twilio = require('twilio');
} catch (e) {
    console.log('Twilio not installed - SMS notifications disabled');
}

class NotificationService {
    constructor(dbPool) {
        this.dbPool = dbPool;
        
        // Email configuration (using environment variables)
        if (nodemailer && process.env.SMTP_USER) {
            try {
                this.emailTransporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: process.env.SMTP_PORT || 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
                console.log('[Notification] Email transporter configured successfully');
                console.log(`[Notification] Using SMTP: ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || 587}`);
            } catch (error) {
                console.error('[Notification] Failed to create email transporter:', error);
                this.emailTransporter = null;
            }
        } else {
            console.log('[Notification] Email not configured - missing SMTP_USER');
            this.emailTransporter = null;
        }

        // SMS configuration (Twilio)
        if (twilio && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.twilioClient = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );
            this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        } else {
            this.twilioClient = null;
        }
    }

    /**
     * Send alert notification based on profile preferences
     */
    async sendAlert(profile, alert) {
        const notificationMethods = [];

        try {
            // Send email notification
            if (profile.alert_preferences.email && profile.alert_email) {
                const emailSent = await this.sendEmailAlert(profile, alert);
                if (emailSent) notificationMethods.push('email');
            }

            // Send SMS notification for RED alerts
            if (profile.alert_preferences.sms && profile.alert_phone && alert.alert_level === 'RED') {
                const smsSent = await this.sendSMSAlert(profile, alert);
                if (smsSent) notificationMethods.push('sms');
            }

            // Update alert record with notification status
            if (notificationMethods.length > 0) {
                await this.updateAlertNotification(alert.id, notificationMethods);
            }

        } catch (error) {
            console.error('[Notification] Error sending alert:', error);
        }
    }

    /**
     * Send email alert
     */
    async sendEmailAlert(profile, alert) {
        if (!this.emailTransporter) {
            console.log('[Notification] Email not configured');
            return false;
        }
        
        try {
            const subject = this.getEmailSubject(alert);
            const html = this.getEmailHTML(profile, alert);

            const mailOptions = {
                from: process.env.SMTP_FROM || 'Auto Audit Pro <alerts@autoauditpro.com>',
                to: profile.alert_email,
                subject: subject,
                html: html
            };

            await this.emailTransporter.sendMail(mailOptions);
            console.log(`[Notification] Email sent to ${profile.alert_email} for ${profile.dealer_name}`);
            return true;

        } catch (error) {
            console.error('[Notification] Error sending email:', error);
            return false;
        }
    }

    /**
     * Send SMS alert
     */
    async sendSMSAlert(profile, alert) {
        if (!this.twilioClient) {
            console.log('[Notification] SMS not configured');
            return false;
        }

        try {
            const message = this.getSMSMessage(profile, alert);

            await this.twilioClient.messages.create({
                body: message,
                from: this.twilioPhoneNumber,
                to: profile.alert_phone
            });

            console.log(`[Notification] SMS sent to ${profile.alert_phone} for ${profile.dealer_name}`);
            return true;

        } catch (error) {
            console.error('[Notification] Error sending SMS:', error);
            return false;
        }
    }

    /**
     * Get email subject based on alert level
     */
    getEmailSubject(alert) {
        const prefix = alert.alert_level === 'RED' ? '🔴 CRITICAL' : '🟡 WARNING';
        return `${prefix}: Website Issue Detected - ${alert.alert_type}`;
    }

    /**
     * Generate email HTML content
     */
    getEmailHTML(profile, alert) {
        const alertColor = alert.alert_level === 'RED' ? '#dc3545' : '#ffc107';
        const alertEmoji = alert.alert_level === 'RED' ? '🔴' : '🟡';

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
        }
        .header {
            background-color: ${alertColor};
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f8f9fa;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .alert-message {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            padding: 15px;
            background-color: white;
            border-left: 5px solid ${alertColor};
        }
        .details {
            background-color: white;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .action-button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${alertEmoji} ${alert.alert_level} Alert</h1>
        <h2>${profile.dealer_name}</h2>
    </div>
    
    <div class="content">
        <div class="alert-message">
            ${alert.alert_message}
        </div>
        
        <div class="details">
            <h3>Issue Details:</h3>
            <p><strong>Website:</strong> ${profile.website_url}</p>
            <p><strong>Alert Type:</strong> ${alert.alert_type}</p>
            <p><strong>Detected At:</strong> ${new Date(alert.created_at).toLocaleString()}</p>
            <p><strong>Alert Level:</strong> ${alert.alert_level}</p>
        </div>
        
        <center>
            <a href="${process.env.APP_URL || 'http://localhost:3002'}/monitoring/dashboard/${profile.id}" class="action-button">
                View Dashboard
            </a>
        </center>
        
        <h3>What This Means:</h3>
        ${this.getAlertExplanation(alert)}
        
        <h3>Recommended Actions:</h3>
        ${this.getRecommendedActions(alert)}
    </div>
    
    <div class="footer">
        <p>This is an automated alert from Auto Audit Pro Website Monitoring</p>
        <p>To update your notification preferences, please visit your dashboard</p>
    </div>
</body>
</html>`;
    }

    /**
     * Get SMS message content
     */
    getSMSMessage(profile, alert) {
        const prefix = alert.alert_level === 'RED' ? '🔴 CRITICAL' : '🟡 WARNING';
        return `${prefix} Website Alert - ${profile.dealer_name}\n\n${alert.alert_message}\n\nCheck dashboard for details: ${process.env.APP_URL || 'http://localhost:3002'}/monitoring`;
    }

    /**
     * Get alert explanation based on type
     */
    getAlertExplanation(alert) {
        const explanations = {
            'website_down': '<p>Your website is currently unreachable. Customers trying to visit your site will see an error message. This means you are losing potential leads and sales.</p>',
            'ssl_invalid': '<p>Your SSL certificate is invalid or expired. Web browsers are showing security warnings to visitors, which will cause most customers to leave immediately.</p>',
            'forms_not_working': '<p>Contact forms on your website are not functioning properly. Customers trying to submit inquiries are unable to do so, resulting in lost leads.</p>',
            'no_inventory': '<p>No vehicle inventory is displaying on your website. Customers cannot browse your available vehicles, severely impacting your ability to generate leads.</p>',
            'slow_load_time': '<p>Your website is taking too long to load. Studies show that users abandon sites that take more than 3 seconds to load, resulting in lost traffic and leads.</p>',
            'ssl_expiring_soon': '<p>Your SSL certificate will expire soon. Once expired, browsers will show security warnings that will drive customers away.</p>'
        };

        return explanations[alert.alert_type] || '<p>An issue has been detected that requires your attention.</p>';
    }

    /**
     * Get recommended actions based on alert type
     */
    getRecommendedActions(alert) {
        const actions = {
            'website_down': `
                <ul>
                    <li>Contact your hosting provider immediately</li>
                    <li>Check if your domain registration is current</li>
                    <li>Verify DNS settings are correct</li>
                    <li>Review server error logs</li>
                </ul>`,
            'ssl_invalid': `
                <ul>
                    <li>Contact your hosting provider to renew SSL certificate</li>
                    <li>Ensure SSL is properly installed on all subdomains</li>
                    <li>Update any hardcoded HTTP links to HTTPS</li>
                </ul>`,
            'forms_not_working': `
                <ul>
                    <li>Test all forms on your website</li>
                    <li>Check form submission email settings</li>
                    <li>Verify SMTP configuration</li>
                    <li>Review any recent website changes</li>
                </ul>`,
            'no_inventory': `
                <ul>
                    <li>Check inventory feed connection</li>
                    <li>Verify API credentials are valid</li>
                    <li>Contact your inventory provider</li>
                    <li>Review any recent integration changes</li>
                </ul>`,
            'slow_load_time': `
                <ul>
                    <li>Optimize large images on your site</li>
                    <li>Enable caching and compression</li>
                    <li>Review hosting plan performance</li>
                    <li>Consider using a CDN</li>
                </ul>`
        };

        return actions[alert.alert_type] || `
            <ul>
                <li>Review the issue details in your monitoring dashboard</li>
                <li>Contact your website provider for assistance</li>
            </ul>`;
    }

    /**
     * Update alert notification status
     */
    async updateAlertNotification(alertId, methods) {
        try {
            const query = `
                UPDATE alert_history 
                SET notification_sent = true,
                    notification_method = $2,
                    notification_sent_at = CURRENT_TIMESTAMP
                WHERE id = $1`;
            
            await this.dbPool.query(query, [alertId, methods.join(',')]);
        } catch (error) {
            console.error('[Notification] Error updating alert status:', error);
        }
    }

    /**
     * Send weekly summary report
     */
    async sendWeeklySummary(profile) {
        // Implementation for weekly summary reports
        // This would aggregate data from the past week and send a comprehensive report
    }
    
    /**
     * Generic email sender (for test notifications)
     */
    async sendEmail(to, subject, htmlContent) {
        if (!this.emailTransporter) {
            console.log('[Notification] Email not configured - skipping email');
            return false;
        }
        
        try {
            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: to,
                subject: subject,
                html: htmlContent
            };
            
            await this.emailTransporter.sendMail(mailOptions);
            console.log(`[Notification] Test email sent to ${to}`);
            return true;
        } catch (error) {
            console.error('[Notification] Error sending test email:', error);
            throw error;
        }
    }
    
    /**
     * Generic SMS sender (for test notifications)
     */
    async sendSMS(to, message) {
        if (!this.twilioClient) {
            console.log('[Notification] SMS not configured - skipping SMS');
            return false;
        }
        
        try {
            await this.twilioClient.messages.create({
                body: message,
                from: this.twilioPhoneNumber,
                to: to
            });
            
            console.log(`[Notification] Test SMS sent to ${to}`);
            return true;
        } catch (error) {
            console.error('[Notification] Error sending test SMS:', error);
            throw error;
        }
    }
}

module.exports = NotificationService;