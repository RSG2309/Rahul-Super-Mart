import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(__dirname, '../../.data/notification_logs.json');

export interface INotificationLog {
  id: string;
  type: 'sms' | 'whatsapp' | 'email';
  recipient: string;
  subject?: string;
  message: string;
  attachmentName?: string;
  timestamp: string;
}

const ensureLogFile = () => {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
};

const logNotification = (type: 'sms' | 'whatsapp' | 'email', recipient: string, message: string, subject?: string, attachmentName?: string) => {
  ensureLogFile();
  try {
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')) as INotificationLog[];
    const newLog: INotificationLog = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      recipient,
      subject,
      message,
      attachmentName,
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    
    // Print to console for easy viewing during debugging
    console.log(`\n📢 [NOTIF - ${type.toUpperCase()}] To: ${recipient}`);
    if (subject) console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    if (attachmentName) console.log(`Attachment: ${attachmentName}`);
    console.log(`----------------------------------------\n`);
  } catch (error) {
    console.error('Failed to log notification', error);
  }
};

export const NotificationService = {
  sendSMS: async (mobile: string, message: string): Promise<boolean> => {
    logNotification('sms', mobile, message);
    return true;
  },

  sendWhatsApp: async (mobile: string, message: string, attachmentName?: string): Promise<boolean> => {
    logNotification('whatsapp', mobile, message, undefined, attachmentName);
    return true;
  },

  sendEmail: async (email: string, subject: string, message: string, attachmentName?: string): Promise<boolean> => {
    logNotification('email', email, message, subject, attachmentName);
    return true;
  },

  getLogs: (): INotificationLog[] => {
    ensureLogFile();
    try {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    } catch {
      return [];
    }
  },

  clearLogs: (): void => {
    ensureLogFile();
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
};
