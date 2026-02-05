 import { useState } from "react";
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { MessageSquare, Send, Loader2 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { z } from "zod";
 
 const phoneSchema = z.string()
   .min(10, "Phone number must be at least 10 digits")
   .max(20, "Phone number too long")
   .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number format (use E.164: +1234567890)");
 
 const messageSchema = z.string()
   .min(1, "Message cannot be empty")
   .max(1600, "Message exceeds SMS limit (1600 chars)");
 
 interface SendSMSDialogProps {
   patientCode?: string;
   defaultPhone?: string;
   trigger?: React.ReactNode;
 }
 
 export function SendSMSDialog({ patientCode, defaultPhone = "", trigger }: SendSMSDialogProps) {
   const [open, setOpen] = useState(false);
   const [phone, setPhone] = useState(defaultPhone);
   const [message, setMessage] = useState("");
   const [sending, setSending] = useState(false);
   const [errors, setErrors] = useState<{ phone?: string; message?: string }>({});
 
   const validateForm = () => {
     const newErrors: { phone?: string; message?: string } = {};
     
     const phoneResult = phoneSchema.safeParse(phone);
     if (!phoneResult.success) {
       newErrors.phone = phoneResult.error.errors[0].message;
     }
     
     const messageResult = messageSchema.safeParse(message);
     if (!messageResult.success) {
       newErrors.message = messageResult.error.errors[0].message;
     }
     
     setErrors(newErrors);
     return Object.keys(newErrors).length === 0;
   };
 
   const handleSend = async () => {
     if (!validateForm()) return;
 
     setSending(true);
     try {
       const { data, error } = await supabase.functions.invoke("send-sms", {
         body: { to: phone, message },
       });
 
       if (error) {
         console.error("SMS error:", error);
         toast.error(error.message || "Failed to send SMS");
         return;
       }
 
       if (data?.success) {
         toast.success(`SMS sent successfully to ${phone}`);
         setMessage("");
         setOpen(false);
       } else {
         toast.error(data?.error || "Failed to send SMS");
       }
     } catch (err) {
       console.error("SMS error:", err);
       toast.error("Failed to send SMS. Please try again.");
     } finally {
       setSending(false);
     }
   };
 
   const charCount = message.length;
   const smsSegments = Math.ceil(charCount / 160) || 1;
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         {trigger || (
           <Button variant="outline" size="sm">
             <MessageSquare className="h-4 w-4 mr-2" />
             Send SMS
           </Button>
         )}
       </DialogTrigger>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <MessageSquare className="h-5 w-5" />
             Send SMS Notification
           </DialogTitle>
           <DialogDescription>
             {patientCode 
               ? `Send an SMS notification to patient ${patientCode}`
               : "Send an SMS notification to a phone number"
             }
           </DialogDescription>
         </DialogHeader>
         
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="phone">Phone Number</Label>
             <Input
               id="phone"
               type="tel"
               placeholder="+1234567890"
               value={phone}
               onChange={(e) => {
                 setPhone(e.target.value);
                 if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
               }}
               className={errors.phone ? "border-destructive" : ""}
             />
             {errors.phone && (
               <p className="text-sm text-destructive">{errors.phone}</p>
             )}
             <p className="text-xs text-muted-foreground">
               Use E.164 format (e.g., +1234567890)
             </p>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="message">Message</Label>
             <Textarea
               id="message"
               placeholder="Enter your message..."
               value={message}
               onChange={(e) => {
                 setMessage(e.target.value);
                 if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
               }}
               className={`min-h-[120px] ${errors.message ? "border-destructive" : ""}`}
               maxLength={1600}
             />
             {errors.message && (
               <p className="text-sm text-destructive">{errors.message}</p>
             )}
             <div className="flex justify-between text-xs text-muted-foreground">
               <span>{charCount}/1600 characters</span>
               <span>{smsSegments} SMS segment{smsSegments > 1 ? "s" : ""}</span>
             </div>
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
             Cancel
           </Button>
           <Button onClick={handleSend} disabled={sending || !phone || !message}>
             {sending ? (
               <>
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 Sending...
               </>
             ) : (
               <>
                 <Send className="h-4 w-4 mr-2" />
                 Send SMS
               </>
             )}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }