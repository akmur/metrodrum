import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar />
      <main className="container mx-auto flex-1 px-4">
        <Outlet />
      </main>
      <footer className="py-4 text-center text-sm" style={{ color: "rgb(64 78 96)" }}>
        Vibecoded by{" "}
        <a
          href="https://ale.muraro.xyz"
          className="underline"
          style={{ color: "rgb(64 78 96)" }}
        >
          Alessandro Muraro
        </a>
      </footer>
    </div>
  );
}
