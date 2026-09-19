import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { IconBell, IconChart, IconColumns, IconCompass } from "./icons";

const NAV_ITEMS = [
  { to: "/", label: "Pipeline", icon: IconColumns, end: true },
  { to: "/reminders", label: "Reminders", icon: IconBell, end: false },
  { to: "/reports", label: "Reports", icon: IconChart, end: false },
];

export function Layout() {
  const location = useLocation();

  return (
    <>
      <div className="app-backdrop" aria-hidden="true" />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <IconCompass width={17} height={17} />
            </div>
            <div>
              <span className="brand-word">Nomad</span>
              <span className="brand-tag">CRM</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-item-link">
                {({ isActive }) => (
                  <span className={`nav-item${isActive ? " active" : ""}`}>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="nav-pill"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <item.icon width={16} height={16} />
                    {item.label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <strong>Weekend build.</strong> Kanban pipeline, follow-ups &amp; reports —
            replacing three spreadsheets a client used to juggle.
          </div>
        </aside>

        <main className="main">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
