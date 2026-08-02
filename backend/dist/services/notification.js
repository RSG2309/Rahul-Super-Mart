"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOG_FILE = path_1.default.join(__dirname, '../../.data/notification_logs.json');
const ensureLogFile = () => {
    const dir = path_1.default.dirname(LOG_FILE);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    if (!fs_1.default.existsSync(LOG_FILE)) {
        fs_1.default.writeFileSync(LOG_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
};
const logNotification = (type, recipient, message, subject, attachmentName) => {
    ensureLogFile();
    try {
        const logs = JSON.parse(fs_1.default.readFileSync(LOG_FILE, 'utf-8'));
        const newLog = {
            id: Math.random().toString(36).substring(2, 11),
            type,
            recipient,
            subject,
            message,
            attachmentName,
            timestamp: new Date().toISOString()
        };
        logs.push(newLog);
        fs_1.default.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
        // Print to console for easy viewing during debugging
        console.log(`\n📢 [NOTIF - ${type.toUpperCase()}] To: ${recipient}`);
        if (subject)
            console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
        if (attachmentName)
            console.log(`Attachment: ${attachmentName}`);
        console.log(`----------------------------------------\n`);
    }
    catch (error) {
        console.error('Failed to log notification', error);
    }
};
exports.NotificationService = {
    sendSMS: async (mobile, message) => {
        logNotification('sms', mobile, message);
        return true;
    },
    sendWhatsApp: async (mobile, message, attachmentName) => {
        logNotification('whatsapp', mobile, message, undefined, attachmentName);
        return true;
    },
    sendEmail: async (email, subject, message, attachmentName) => {
        logNotification('email', email, message, subject, attachmentName);
        return true;
    },
    getLogs: () => {
        ensureLogFile();
        try {
            return JSON.parse(fs_1.default.readFileSync(LOG_FILE, 'utf-8'));
        }
        catch {
            return [];
        }
    },
    clearLogs: () => {
        ensureLogFile();
        fs_1.default.writeFileSync(LOG_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
};
