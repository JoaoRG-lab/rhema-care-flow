 export interface CalendarEvent {
   id: string;
   date: string;
   type: 'followup' | 'infusion' | 'shift' | 'monitoring';
   title: string;
   subtitle?: string;
   patientId?: string;
   status?: string;
 }