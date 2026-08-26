import { useEffect } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders } from "../features/orders/ordersSlice";
import { formatCurrency, formatDate } from "../utils/format";
import { SpinnerIcon, PackageIcon } from "../components/common/Icons";

export default function OrdersPage() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="eyebrow mb-2">Order History</p>
      <h1 className="section-title mb-8">My Orders</h1>

      {loading ? (
        <div className="flex justify-center py-24">
          <SpinnerIcon size={28} style={{ color: "var(--accent)" }} />
        </div>
      ) : !orders.length ? (
        <div className="py-20 text-center">
          <PackageIcon size={44} style={{ color: "var(--ink-faint)" }} />
          <p
            className="mt-4 font-display text-2xl"
            style={{ color: "var(--ink-muted)" }}
          >
            No orders yet
          </p>
          <Link to="/shop" className="btn btn-accent mt-6">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="card flex flex-wrap items-center justify-between gap-4 p-5 transition-all hover:border-(--accent)"
            >
              <div>
                <p className="font-semibold">
                  Order #{order._id.slice(-8).toUpperCase()}
                </p>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {formatDate(order.createdAt)} · {order.orderItems.length}{" "}
                  {order.orderItems.length === 1 ? "item" : "items"} ·{" "}
                  {order.paymentMethod}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`status-pill status-${order.orderStatus}`}>
                  {order.orderStatus}
                </span>
                <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
