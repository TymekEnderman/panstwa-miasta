import { createBrowserRouter, Navigate } from "react-router-dom";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { GamePage } from "@/pages/GamePage";
import { GamePlayPage } from "@/pages/GamePlayPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/game" replace />,
  },
  {
    path: "/game",
    element: <GamePage />,
  },
  {
    path: "/game/play",
    element: <GamePlayPage />,
  },
  {
    path: "/categories",
    element: <CategoriesPage />,
  },
  {
    path: "*",
    element: <Navigate to="/game" replace />,
  },
]);
