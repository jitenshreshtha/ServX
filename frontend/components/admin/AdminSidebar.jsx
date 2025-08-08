import React from "react";

export default function AdminSidebar({ active, onTab }) {
  const menu = [
    ["overview", "Overview", "/admin-dashboard"],
    ["listings", "Listings", "/admin-dashboard"],
    ["users", "Users", "/admin-dashboard"],
    ["reports", "Reported Messages", "/admin/reported-messages"],
    ["tickets", "Support Tickets", "/admin/tickets"],
  ];

  return (
    <nav className="bg-light p-3 border-end min-vh-100" aria-label="Admin sidebar">
      <h5 className="mb-4">Admin Panel</h5>
      <ul className="nav flex-column gap-1">
        {menu.map(([key, label, href]) => (
          <li className="nav-item" key={key}>
            {onTab ? (
              <button
                className={`nav-link btn text-start w-100 ${active === key ? 'fw-bold text-primary' : ''}`}
                onClick={() => onTab(key)}
              >
                {label}
              </button>
            ) : (
              <a
                href={href}
                className={`nav-link ${active === key ? 'fw-bold text-primary' : ''}`}
              >
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
