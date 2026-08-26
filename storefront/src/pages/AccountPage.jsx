import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../features/auth/authSlice";
import { fetchAddresses } from "../features/addresses/addressesSlice";
import { pushToast } from "../features/ui/uiSlice";
import { LogoutIcon } from "../components/common/Icons";
import { getAssetUrl } from "../utils/assetUrl";
import { formatDate, titleCase } from "../utils/format";

/**
 * AccountPage — /account view-only details grid (niyabags jaisa).
 * Edit profile alag /profile page par hota hai.
 * Address User model ka field nahi — addressesSlice se default address dikhate hain.
 */
export default function AccountPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { addresses } = useSelector((s) => s.addresses);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(pushToast("Logged out successfully", "info"));
    navigate("/");
  };

  // Default address, warna pehla saved
  const primaryAddress =
    addresses.find((a) => a.is_default) || addresses[0] || null;
  const addressText = primaryAddress
    ? `${primaryAddress.street}, ${primaryAddress.city}, ${primaryAddress.state} — ${primaryAddress.pincode}`
    : "";

  const fields = [
    { label: "Name", value: user?.name },
    { label: "Email", value: user?.email },
    { label: "Phone", value: user?.phone },
    { label: "Gender", value: user?.gender ? titleCase(user.gender) : "" },
    { label: "Date of Birth", value: user?.dateOfBirth ? formatDate(user.dateOfBirth) : "" },
    { label: "Default Address", value: addressText },
  ];

  const initial = (user?.name || "N").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Header row */}
      <div className="mb-12 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar ho toh image, warna initial */}
          {user?.avatar ? (
            <img
              src={getAssetUrl(user.avatar)}
              alt={user.name || "Avatar"}
              className="h-16 w-16 rounded-full border object-cover"
              style={{ borderColor: "var(--border-strong)" }}
            />
          ) : (
            <span
              className="font-display flex h-16 w-16 items-center justify-center rounded-full text-xl font-medium"
              style={{ background: "var(--accent)", color: "#101d1d" }}
            >
              {initial}
            </span>
          )}
          <div>
            <p className="eyebrow mb-1">My Account</p>
            <h1 className="font-display text-2xl font-medium" style={{ color: "var(--ink)" }}>
              Welcome, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
              Manage your Niya Bags account and personal details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="border-b pb-0.5 text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 border-b pb-0.5 text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Sign Out <LogoutIcon size={13} />
          </button>
        </div>
      </div>

      {/* Details grid */}
      <div className="card grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2 sm:p-10">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="eyebrow mb-2">{field.label}</p>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              {field.value || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

