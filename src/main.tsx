import { createRoot } from "react-dom/client";
import '@/i18n';
import App from "./App.tsx";
import "./index.css";
import { startLoopDetectorAuto } from "./lib/loopDetectorAutoStart";

// Run the recurrence/loop detector continuously from app boot.
startLoopDetectorAuto();

createRoot(document.getElementById("root")!).render(<App />);
