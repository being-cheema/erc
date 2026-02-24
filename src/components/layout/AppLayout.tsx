import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const AppLayout = () => {
  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-background">
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
