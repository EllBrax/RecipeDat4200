// src/layouts/RootLayout.jsx
import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar/NavBar";

export default function RootLayout() {
  return (
    <>
      <NavBar />
      <main className="app-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </>
  );
}
