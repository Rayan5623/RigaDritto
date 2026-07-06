import { useNavigate } from "react-router-dom";

export default function Header({ titolo, azioneDestra }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-100 dark:border-gray-900 px-4 py-3 flex items-center justify-between safe-top">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{titolo}</h1>
      <div className="flex items-center gap-1">
        {azioneDestra}
        <button
          onClick={() => navigate("/impostazioni")}
          aria-label="impostazioni"
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 active:bg-gray-100 dark:active:bg-gray-800"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
