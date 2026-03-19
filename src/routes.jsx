import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Template from "./pages/template/template";

export default function Router() {
  const token = localStorage.getItem("token") || "";
  console.log(token);
  
  return (
    <BrowserRouter  >
      {token =='' ?
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

        </Routes>
        :
        <Template />}
    </BrowserRouter>
  );
}
