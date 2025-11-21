import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ShipDataPage from "./pages/ShipDataPage";
import { Navigate } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/shipdata" replace />} />
        <Route path="/shipdata" element={<ShipDataPage />} />
      </Routes>
    </Router>
  );
}

export default App;
