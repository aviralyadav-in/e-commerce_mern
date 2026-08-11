import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="flex flex-col items-center gap-6">
        <div className="text-3xl font-black tracking-tight">
          <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
            ShopSphere
          </span>
        </div>
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-400"></div>
          <div className="absolute inset-2 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-400 [animation-direction:reverse] [animation-duration:0.75s]"></div>
        </div>
        <div className="text-center">
          <h2 className="text-base font-semibold text-slate-200">Loading...</h2>
          <p className="mt-1 text-sm text-slate-500">Please wait</p>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isCheckingSession } = useSelector(
    (state) => state.auth,
  );

  const location = useLocation();

  if (isCheckingSession) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
