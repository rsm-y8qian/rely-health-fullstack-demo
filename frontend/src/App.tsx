import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AppLayout from "./components/AppLayout";
import BuilderHome from "./pages/BuilderHome";
import BuilderPage from "./pages/BuilderPage";
import OperationsPage from "./pages/OperationsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<BuilderHome />} />
          <Route path="edit/:id" element={<BuilderPage />} />
          <Route path="operations" element={<OperationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
