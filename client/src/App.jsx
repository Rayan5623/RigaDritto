import { Routes, Route } from "react-router-dom";
import Home from "./screens/Home.jsx";
import Cattura from "./screens/Cattura.jsx";
import Dettaglio from "./screens/Dettaglio.jsx";
import Scadenze from "./screens/Scadenze.jsx";
import ChiusuraSerale from "./screens/ChiusuraSerale.jsx";
import Report from "./screens/Report.jsx";
import Impostazioni from "./screens/Impostazioni.jsx";
import TabBar from "./components/TabBar.jsx";
import ConnessioneStatus from "./components/ConnessioneStatus.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <ConnessioneStatus />
      <main className="flex-1 overflow-y-auto pb-24 safe-top">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cattura" element={<Cattura />} />
          <Route path="/tessera/:id" element={<Dettaglio />} />
          <Route path="/scadenze" element={<Scadenze />} />
          <Route path="/chiusura" element={<ChiusuraSerale />} />
          <Route path="/report" element={<Report />} />
          <Route path="/impostazioni" element={<Impostazioni />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
