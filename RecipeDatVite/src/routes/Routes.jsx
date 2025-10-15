import { Routes as RRDRoutes, Route } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";

import Home from "../pages/Home";
import About from "../pages/About";
import Cookbook from "../pages/Cookbook";
import TheKitchen from "../pages/TheKitchen";

export default function AppRoutes() {
  return (
    <RRDRoutes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/cookbook" element={<Cookbook />} />
        <Route path="/thekitchen" element={<TheKitchen />} />
      </Route>
    </RRDRoutes>
  );
}
