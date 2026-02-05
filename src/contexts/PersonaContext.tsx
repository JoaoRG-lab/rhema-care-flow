 import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
 
 export type Persona = 'clinical' | 'academic' | 'patient';
 
 interface PersonaContextType {
   persona: Persona;
   setPersona: (persona: Persona) => void;
   isPatientView: boolean;
   isAcademicView: boolean;
   isClinicalView: boolean;
 }
 
 const PersonaContext = createContext<PersonaContextType | undefined>(undefined);
 
 export function PersonaProvider({ children }: { children: ReactNode }) {
   const [persona, setPersona] = useState<Persona>(() => {
     const stored = localStorage.getItem('rheumaflow-persona');
     return (stored as Persona) || 'clinical';
   });
 
   useEffect(() => {
     localStorage.setItem('rheumaflow-persona', persona);
   }, [persona]);
 
   return (
     <PersonaContext.Provider
       value={{
         persona,
         setPersona,
         isPatientView: persona === 'patient',
         isAcademicView: persona === 'academic',
         isClinicalView: persona === 'clinical',
       }}
     >
       {children}
     </PersonaContext.Provider>
   );
 }
 
 export function usePersona() {
   const context = useContext(PersonaContext);
   if (!context) {
     throw new Error('usePersona must be used within PersonaProvider');
   }
   return context;
 }