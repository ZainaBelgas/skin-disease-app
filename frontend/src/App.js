import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Patient from "./pages/Patient";
import Doctor from "./pages/Doctor";
import Admin from "./pages/Admin";

function App() {
  const role = localStorage.getItem("role");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Login />} />
        <Route path="/patient" element={<Patient />} />
        <Route path="/doctor"  element={<Doctor />} />
        <Route path="/admin"   element={<Admin />} />
        <Route path="*"        element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;