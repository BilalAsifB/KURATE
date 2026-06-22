import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import WorkspacePage from "./pages/WorkspacePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DocumentsPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/workspace/:documentId" element={<WorkspacePage />} />
      </Route>
    </Routes>
  );
}