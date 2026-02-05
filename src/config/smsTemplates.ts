 /**
  * SMS Templates for common appointment notifications
  * Variables use {{variableName}} syntax for replacement
  */
 
 export interface SMSTemplate {
   id: string;
   name: string;
   category: 'appointment' | 'medication' | 'lab' | 'general';
   message: string;
   variables: string[];
 }
 
 export const SMS_TEMPLATES: SMSTemplate[] = [
   // Appointment Reminders
   {
     id: 'apt_reminder_24h',
     name: 'Appointment Reminder (24h)',
     category: 'appointment',
     message: 'Reminder: Your appointment is tomorrow, {{date}} at {{time}} with {{provider}}. Reply CONFIRM or call {{clinicPhone}} to reschedule.',
     variables: ['date', 'time', 'provider', 'clinicPhone'],
   },
   {
     id: 'apt_reminder_1h',
     name: 'Appointment Reminder (1h)',
     category: 'appointment',
     message: 'Your appointment is in 1 hour at {{time}} with {{provider}}. Location: {{location}}. See you soon!',
     variables: ['time', 'provider', 'location'],
   },
   {
     id: 'apt_confirmation',
     name: 'Appointment Confirmation',
     category: 'appointment',
     message: 'Your appointment is confirmed for {{date}} at {{time}} with {{provider}}. Address: {{address}}. Please arrive 15 min early.',
     variables: ['date', 'time', 'provider', 'address'],
   },
   {
     id: 'apt_followup_scheduled',
     name: 'Follow-up Scheduled',
     category: 'appointment',
     message: 'Your follow-up appointment has been scheduled for {{date}} at {{time}}. Call {{clinicPhone}} if you need to change this.',
     variables: ['date', 'time', 'clinicPhone'],
   },
   {
     id: 'apt_reschedule',
     name: 'Reschedule Request',
     category: 'appointment',
     message: 'We need to reschedule your appointment on {{originalDate}}. Please call {{clinicPhone}} to find a new time. We apologize for the inconvenience.',
     variables: ['originalDate', 'clinicPhone'],
   },
 
   // Medication Reminders
   {
     id: 'med_infusion_reminder',
     name: 'Infusion Reminder',
     category: 'medication',
     message: 'Reminder: Your {{medication}} infusion is scheduled for {{date}}. Please bring your insurance card and arrive 15 min early.',
     variables: ['medication', 'date'],
   },
   {
     id: 'med_refill',
     name: 'Medication Refill',
     category: 'medication',
     message: 'Time to refill your {{medication}}. Contact your pharmacy or call {{clinicPhone}} if you need a new prescription.',
     variables: ['medication', 'clinicPhone'],
   },
   {
     id: 'med_injection_due',
     name: 'Self-Injection Due',
     category: 'medication',
     message: 'Reminder: Your {{medication}} injection is due {{dueDate}}. Contact us at {{clinicPhone}} if you have questions.',
     variables: ['medication', 'dueDate', 'clinicPhone'],
   },
 
   // Lab Reminders
   {
     id: 'lab_reminder',
     name: 'Lab Work Reminder',
     category: 'lab',
     message: 'Reminder: Please complete your lab work before {{date}}. Fasting required: {{fasting}}. Location: {{labLocation}}.',
     variables: ['date', 'fasting', 'labLocation'],
   },
   {
     id: 'lab_results_ready',
     name: 'Lab Results Ready',
     category: 'lab',
     message: 'Your lab results are ready. Log in to your patient portal to view them, or call {{clinicPhone}} with questions.',
     variables: ['clinicPhone'],
   },
 
   // General
   {
     id: 'gen_welcome',
     name: 'Welcome Message',
     category: 'general',
     message: 'Welcome to {{clinicName}}! We look forward to caring for you. Save this number for appointment updates. Reply STOP to opt out.',
     variables: ['clinicName'],
   },
   {
     id: 'gen_survey',
     name: 'Feedback Request',
     category: 'general',
     message: 'Thank you for visiting {{clinicName}}. We value your feedback! Please rate your experience: {{surveyLink}}',
     variables: ['clinicName', 'surveyLink'],
   },
 ];
 
 export function getTemplatesByCategory(category: SMSTemplate['category']) {
   return SMS_TEMPLATES.filter((t) => t.category === category);
 }
 
 export function fillTemplate(template: SMSTemplate, values: Record<string, string>): string {
   let message = template.message;
   for (const [key, value] of Object.entries(values)) {
     message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
   }
   return message;
 }
 
 export function getUnfilledVariables(template: SMSTemplate, values: Record<string, string>): string[] {
   return template.variables.filter((v) => !values[v] || values[v].trim() === '');
 }