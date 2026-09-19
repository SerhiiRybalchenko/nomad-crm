import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PipelinePage } from "./pages/PipelinePage";
import { RemindersPage } from "./pages/RemindersPage";
import { ReportsPage } from "./pages/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PipelinePage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
