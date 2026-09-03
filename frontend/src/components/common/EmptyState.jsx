import { InboxIcon } from "./Icon";

/**
 * Shown inside a table body (as a full-width cell) or on its own.
 * `action` is usually the same primary button as the page header, so an
 * empty table is never a dead end.
 */
const EmptyState = ({
  icon,
  title = "Nothing here yet",
  message,
  action,
  compact = false,
}) => (
  <div className="empty-state" style={compact ? { padding: "34px 20px" } : undefined}>
    <span className="empty-state-icon">
      {icon || <InboxIcon className="w-5 h-5" />}
    </span>
    <p className="empty-state-title">{title}</p>
    {message && <p className="empty-state-text">{message}</p>}
    {action && <div className="mt-3.5">{action}</div>}
  </div>
);

export default EmptyState;
