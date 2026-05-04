import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ProjectPage from "./pages/ProjectPage";
import NotePage from "./pages/NotePage";
import CalendarPage from "./pages/CalendarPage";
import DayPage from "./pages/DayPage";
import SearchPage from "./pages/SearchPage";
import TimelinePage from "./pages/TimelinePage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
            <Route path="/note/:noteId" element={<NotePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/calendar/:date" element={<DayPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
