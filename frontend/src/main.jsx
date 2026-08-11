import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import { store } from "./redux/store";
import { checkSession } from "./redux/slices/authSlice";

function AuthBootstrap() {
  const dispatch = useDispatch();
  const { isCheckingSession } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="text-3xl font-black tracking-tight">
            <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
              ShopSphere
            </span>
          </div>

          {/* Spinner */}
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-400"></div>
            <div className="absolute inset-2 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-400 [animation-direction:reverse] [animation-duration:0.75s]"></div>
          </div>

          <div className="text-center">
            <h2 className="text-base font-semibold text-slate-200">
              Setting up your experience...
            </h2>
            <p className="mt-1 text-sm text-slate-500">Just a moment please</p>
          </div>
        </div>
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <AuthBootstrap />
    </BrowserRouter>
  </Provider>,
);
