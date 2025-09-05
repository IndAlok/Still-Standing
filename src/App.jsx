import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Login/Login";
import SignUpPage from "./pages/Login/signup";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<SignUpPage />} />
    </Routes>
  );
}
export default App;
