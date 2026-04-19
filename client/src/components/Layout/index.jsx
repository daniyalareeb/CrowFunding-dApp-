import { ToastContainer } from "react-toastify";

import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="w-full flex min-h-screen gap-3 p-2">
      <Sidebar />
      {/* flex-1 + min-w-0: fills remaining width without overflowing */}
      <div className="flex-1 min-w-0 flex flex-col pb-4">
        <Topbar />
        <main className="flex-1">{children}</main>
        <ToastContainer
          position="bottom-center"
          autoClose={3000}
          hideProgressBar
          closeOnClick
          pauseOnHover
          draggable={false}
          theme="dark"
          toastClassName="!bg-[rgba(18,18,40,0.95)] !backdrop-blur-md !border !border-white/10 !rounded-2xl !shadow-glass"
          className="w-full max-w-[400px]"
        />
      </div>
    </div>
  );
};

export default Layout;
