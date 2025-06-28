import nodemailer from 'nodemailer';
import twilio from 'twilio';
import cron from 'node-cron';

export class SmartAlertSystem {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.activeAlerts = new Map();
    this.userSettings = new Map();
    this.emergencyContacts = new Map();
    this.responseTimeouts = new Map();
    
    this.initializeServices();
    this.startMonitoring();
  }

  initializeServices() {
    // Initialize email service
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }

    // Initialize Twilio SMS service
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  async processHealthAssessment(userId, vitals, prediction, userProfile) {
    const alertLevel = this.determineAlertLevel(prediction);
    
    if (alertLevel === 'NONE') return;

    const alert = {
      id: `alert_${Date.now()}_${userId}`,
      userId,
      alertLevel,
      vitals,
      prediction,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      escalated: false
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);

    // Process based on alert level
    switch (alertLevel) {
      case 'CRITICAL':
        await this.handleCriticalAlert(alert, userProfile);
        break;
      case 'HIGH':
        await this.handleHighAlert(alert, userProfile);
        break;
      case 'MODERATE':
        await this.handleModerateAlert(alert, userProfile);
        break;
    }

    return alert;
  }

  determineAlertLevel(prediction) {
    // Critical conditions that require immediate attention
    const criticalConditions = [
      'Severe Hypoxemia',
      'Hypertensive Crisis',
      'Hypothermia',
      'Multiple System Dysfunction'
    ];

    // High priority conditions
    const highPriorityConditions = [
      'Hypertension',
      'Moderate Hypoxemia',
      'High Fever',
      'Tachycardia Risk'
    ];

    if (prediction.risk_level === 'CRITICAL' || 
        prediction.predicted_conditions.some(condition => 
          criticalConditions.some(critical => condition.includes(critical)))) {
      return 'CRITICAL';
    }

    if (prediction.risk_level === 'HIGH' || 
        prediction.predicted_conditions.some(condition => 
          highPriorityConditions.some(high => condition.includes(high)))) {
      return 'HIGH';
    }

    if (prediction.risk_level === 'MODERATE') {
      return 'MODERATE';
    }

    return 'NONE';
  }

  async handleCriticalAlert(alert, userProfile) {
    console.log(`🚨 CRITICAL ALERT for user ${alert.userId}`);

    // Immediate notifications
    await Promise.all([
      this.sendEmailAlert(alert, userProfile, 'CRITICAL'),
      this.sendSMSAlert(alert, userProfile, 'CRITICAL'),
      this.notifyEmergencyContacts(alert, userProfile)
    ]);

    // Start response monitoring
    this.startResponseMonitoring(alert, 30); // 30 seconds for critical

    // Log for emergency services if needed
    this.logEmergencyEvent(alert, userProfile);
  }

  async handleHighAlert(alert, userProfile) {
    console.log(`⚠️ HIGH ALERT for user ${alert.userId}`);

    await Promise.all([
      this.sendEmailAlert(alert, userProfile, 'HIGH'),
      this.sendSMSAlert(alert, userProfile, 'HIGH')
    ]);

    // Start response monitoring
    this.startResponseMonitoring(alert, 120); // 2 minutes for high
  }

  async handleModerateAlert(alert, userProfile) {
    console.log(`💡 MODERATE ALERT for user ${alert.userId}`);

    await this.sendEmailAlert(alert, userProfile, 'MODERATE');
    
    // Longer response time for moderate alerts
    this.startResponseMonitoring(alert, 300); // 5 minutes
  }

  async sendEmailAlert(alert, userProfile, severity) {
    if (!this.emailTransporter || !userProfile.email) return;

    const subject = this.getEmailSubject(severity);
    const htmlContent = this.generateEmailContent(alert, userProfile, severity);

    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@healthai.com',
        to: userProfile.email,
        subject,
        html: htmlContent
      });

      console.log(`📧 Email alert sent to ${userProfile.email}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  async sendSMSAlert(alert, userProfile, severity) {
    if (!this.twilioClient || !userProfile.phone) return;

    const message = this.generateSMSContent(alert, severity);

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: userProfile.phone
      });

      console.log(`📱 SMS alert sent to ${userProfile.phone}`);
    } catch (error) {
      console.error('Failed to send SMS alert:', error);
    }
  }

  async notifyEmergencyContacts(alert, userProfile) {
    const emergencyContacts = this.emergencyContacts.get(alert.userId) || [];
    
    for (const contact of emergencyContacts) {
      await Promise.all([
        this.sendEmergencyEmail(alert, contact, userProfile),
        this.sendEmergencySMS(alert, contact, userProfile)
      ]);
    }
  }

  async sendEmergencyEmail(alert, contact, userProfile) {
    if (!this.emailTransporter || !contact.email) return;

    const subject = `🚨 EMERGENCY: Health Alert for ${userProfile.full_name || 'User'}`;
    const htmlContent = this.generateEmergencyEmailContent(alert, contact, userProfile);

    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'emergency@healthai.com',
        to: contact.email,
        subject,
        html: htmlContent
      });

      console.log(`🚨 Emergency email sent to ${contact.email}`);
    } catch (error) {
      console.error('Failed to send emergency email:', error);
    }
  }

  async sendEmergencySMS(alert, contact, userProfile) {
    if (!this.twilioClient || !contact.phone) return;

    const message = `🚨 EMERGENCY ALERT: ${userProfile.full_name || 'User'} has critical health readings. Risk: ${alert.prediction.risk_level}. Conditions: ${alert.prediction.predicted_conditions.join(', ')}. Please check on them immediately. Time: ${new Date(alert.timestamp).toLocaleString()}`;

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: contact.phone
      });

      console.log(`🚨 Emergency SMS sent to ${contact.phone}`);
    } catch (error) {
      console.error('Failed to send emergency SMS:', error);
    }
  }

  startResponseMonitoring(alert, timeoutSeconds) {
    const timeoutId = setTimeout(async () => {
      if (!this.activeAlerts.get(alert.id)?.acknowledged) {
        await this.handleNoResponse(alert);
      }
    }, timeoutSeconds * 1000);

    this.responseTimeouts.set(alert.id, timeoutId);
  }

  async handleNoResponse(alert) {
    console.log(`⏰ No response to alert ${alert.id} - escalating`);

    // Mark as escalated
    alert.escalated = true;
    this.activeAlerts.set(alert.id, alert);

    // For critical alerts with no response, notify emergency contacts
    if (alert.alertLevel === 'CRITICAL') {
      const userProfile = await this.getUserProfile(alert.userId);
      await this.notifyEmergencyContacts(alert, userProfile);
      
      // Could also trigger emergency services call here
      this.logEmergencyEscalation(alert);
    }

    // Send follow-up notifications
    await this.sendFollowUpNotifications(alert);
  }

  async sendFollowUpNotifications(alert) {
    const userProfile = await this.getUserProfile(alert.userId);
    
    // Send more urgent notifications
    await Promise.all([
      this.sendEmailAlert(alert, userProfile, 'ESCALATED'),
      this.sendSMSAlert(alert, userProfile, 'ESCALATED')
    ]);
  }

  acknowledgeAlert(alertId, userId) {
    const alert = this.activeAlerts.get(alertId);
    if (alert && alert.userId === userId) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      this.activeAlerts.set(alertId, alert);

      // Clear timeout
      const timeoutId = this.responseTimeouts.get(alertId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.responseTimeouts.delete(alertId);
      }

      console.log(`✅ Alert ${alertId} acknowledged by user ${userId}`);
      return true;
    }
    return false;
  }

  addEmergencyContact(userId, contact) {
    const contacts = this.emergencyContacts.get(userId) || [];
    contacts.push({
      id: `contact_${Date.now()}`,
      name: contact.name,
      relationship: contact.relationship,
      email: contact.email,
      phone: contact.phone,
      priority: contact.priority || 1,
      addedAt: new Date().toISOString()
    });
    this.emergencyContacts.set(userId, contacts);
  }

  removeEmergencyContact(userId, contactId) {
    const contacts = this.emergencyContacts.get(userId) || [];
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    this.emergencyContacts.set(userId, updatedContacts);
  }

  updateUserAlertSettings(userId, settings) {
    this.userSettings.set(userId, {
      emailEnabled: settings.emailEnabled ?? true,
      smsEnabled: settings.smsEnabled ?? true,
      emergencyContactsEnabled: settings.emergencyContactsEnabled ?? true,
      responseTimeoutSeconds: settings.responseTimeoutSeconds ?? 60,
      quietHours: settings.quietHours || { start: '22:00', end: '07:00' },
      updatedAt: new Date().toISOString()
    });
  }

  startMonitoring() {
    // Clean up old alerts every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupOldAlerts();
    });

    // Check for missed check-ins every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      this.checkMissedCheckIns();
    });
  }

  cleanupOldAlerts() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (new Date(alert.timestamp).getTime() < oneDayAgo) {
        this.activeAlerts.delete(alertId);
        
        // Clear any pending timeouts
        const timeoutId = this.responseTimeouts.get(alertId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.responseTimeouts.delete(alertId);
        }
      }
    }
  }

  async checkMissedCheckIns() {
    // Implementation for checking if users haven't checked in
    // This could be used for fall detection or wellness checks
    console.log('🔍 Checking for missed check-ins...');
  }

  getEmailSubject(severity) {
    switch (severity) {
      case 'CRITICAL':
        return '🚨 CRITICAL Health Alert - Immediate Attention Required';
      case 'HIGH':
        return '⚠️ HIGH Priority Health Alert';
      case 'MODERATE':
        return '💡 Health Monitoring Alert';
      case 'ESCALATED':
        return '🔴 ESCALATED Health Alert - Response Required';
      default:
        return 'Health Monitoring Notification';
    }
  }

  generateEmailContent(alert, userProfile, severity) {
    const severityColors = {
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MODERATE: '#d97706',
      ESCALATED: '#991b1b'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: ${severityColors[severity]}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-box { background: #f8f9fa; border-left: 4px solid ${severityColors[severity]}; padding: 15px; margin: 15px 0; }
          .vitals { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${severity} Health Alert</h1>
          <p>HealthAI Monitor has detected concerning vital signs</p>
        </div>
        
        <div class="content">
          <p>Dear ${userProfile.full_name || 'User'},</p>
          
          <div class="alert-box">
            <h3>Alert Details</h3>
            <p><strong>Risk Level:</strong> ${alert.prediction.risk_level}</p>
            <p><strong>Risk Score:</strong> ${alert.prediction.risk_score}/100</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
          </div>

          ${alert.prediction.predicted_conditions.length > 0 ? `
            <h3>Identified Conditions:</h3>
            <ul>
              ${alert.prediction.predicted_conditions.map(condition => `<li>${condition}</li>`).join('')}
            </ul>
          ` : ''}

          <div class="vitals">
            <h3>Your Vital Signs</h3>
            <p><strong>Heart Rate:</strong> ${alert.vitals.heart_rate} bpm</p>
            <p><strong>Blood Pressure:</strong> ${alert.vitals.blood_pressure_systolic}/${alert.vitals.blood_pressure_diastolic} mmHg</p>
            <p><strong>SpO₂:</strong> ${alert.vitals.spo2}%</p>
            <p><strong>Temperature:</strong> ${alert.vitals.temperature}°C</p>
          </div>

          ${alert.prediction.recommendations.length > 0 ? `
            <h3>Recommended Actions:</h3>
            <ul>
              ${alert.prediction.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          ` : ''}

          ${severity === 'CRITICAL' ? `
            <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #dc2626;">⚠️ IMMEDIATE ACTION REQUIRED</h3>
              <p>This is a critical health alert. Please seek immediate medical attention or contact emergency services if you are experiencing severe symptoms.</p>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>This alert was generated by HealthAI Monitor. Please acknowledge this alert in the app.</p>
          <p>If this is an emergency, call your local emergency number immediately.</p>
        </div>
      </body>
      </html>
    `;
  }

  generateSMSContent(alert, severity) {
    const emoji = severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '⚠️' : '💡';
    
    let message = `${emoji} HealthAI Alert: ${severity} risk detected. `;
    message += `Risk score: ${alert.prediction.risk_score}/100. `;
    
    if (alert.prediction.predicted_conditions.length > 0) {
      message += `Conditions: ${alert.prediction.predicted_conditions.slice(0, 2).join(', ')}. `;
    }
    
    if (severity === 'CRITICAL') {
      message += 'Seek immediate medical attention. ';
    }
    
    message += `Time: ${new Date(alert.timestamp).toLocaleTimeString()}`;
    
    return message;
  }

  generateEmergencyEmailContent(alert, contact, userProfile) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .emergency-header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .critical-box { background: #fee2e2; border: 2px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="emergency-header">
          <h1>🚨 EMERGENCY HEALTH ALERT</h1>
          <p>Critical health readings detected for ${userProfile.full_name || 'User'}</p>
        </div>
        
        <div class="content">
          <p>Dear ${contact.name},</p>
          
          <div class="critical-box">
            <h3>⚠️ IMMEDIATE ATTENTION REQUIRED</h3>
            <p>You are receiving this emergency notification because ${userProfile.full_name || 'a user'} has been detected with critical health readings that require immediate attention.</p>
          </div>

          <h3>Alert Details:</h3>
          <ul>
            <li><strong>Risk Level:</strong> ${alert.prediction.risk_level}</li>
            <li><strong>Risk Score:</strong> ${alert.prediction.risk_score}/100</li>
            <li><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</li>
            <li><strong>Conditions:</strong> ${alert.prediction.predicted_conditions.join(', ')}</li>
          </ul>

          <h3>Vital Signs:</h3>
          <ul>
            <li>Heart Rate: ${alert.vitals.heart_rate} bpm</li>
            <li>Blood Pressure: ${alert.vitals.blood_pressure_systolic}/${alert.vitals.blood_pressure_diastolic} mmHg</li>
            <li>SpO₂: ${alert.vitals.spo2}%</li>
            <li>Temperature: ${alert.vitals.temperature}°C</li>
          </ul>

          <div class="critical-box">
            <h3>What You Should Do:</h3>
            <ol>
              <li>Contact ${userProfile.full_name || 'the user'} immediately</li>
              <li>Check on their current condition</li>
              <li>If they are unresponsive or in distress, call emergency services</li>
              <li>Ensure they receive appropriate medical attention</li>
            </ol>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  logEmergencyEvent(alert, userProfile) {
    console.log(`🚨 EMERGENCY EVENT LOGGED:`, {
      alertId: alert.id,
      userId: alert.userId,
      timestamp: alert.timestamp,
      riskLevel: alert.prediction.risk_level,
      conditions: alert.prediction.predicted_conditions,
      vitals: alert.vitals
    });
    
    // Here you could log to external emergency services or monitoring systems
  }

  logEmergencyEscalation(alert) {
    console.log(`🔴 EMERGENCY ESCALATION:`, {
      alertId: alert.id,
      userId: alert.userId,
      escalatedAt: new Date().toISOString(),
      originalTimestamp: alert.timestamp
    });
  }

  async getUserProfile(userId) {
    // Mock implementation - replace with actual database query
    return {
      id: userId,
      full_name: 'User',
      email: 'user@example.com',
      phone: '+1234567890'
    };
  }

  // Public API methods
  getActiveAlerts(userId) {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getEmergencyContacts(userId) {
    return this.emergencyContacts.get(userId) || [];
  }

  getUserAlertSettings(userId) {
    return this.userSettings.get(userId) || {
      emailEnabled: true,
      smsEnabled: true,
      emergencyContactsEnabled: true,
      responseTimeoutSeconds: 60,
      quietHours: { start: '22:00', end: '07:00' }
    };
  }
}