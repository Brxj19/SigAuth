import React from 'react';
import { PRODUCT_NAME } from '../branding';
import productLogo from '../assets/logo.png';

function createIcon(path, viewBox = '0 0 24 24') {
  return function Icon({ className = 'h-5 w-5' }) {
    return (
      <svg viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {path}
      </svg>
    );
  };
}

export const DoubleTickIcon = createIcon(
  <>
    {/* First tick */}
    <path d="M4 13l3 3 6-6" />

    {/* Second tick (same size, slightly shifted) */}
    <path d="M8 13l3 3 7-7" />
  </>
);


export const DashboardIcon = createIcon(
  <>
    <path d="M4 13.5h6.5V20H4z" />
    <path d="M13.5 4H20v7.5h-6.5z" />
    <path d="M13.5 13.5H20V20h-6.5z" />
    <path d="M4 4h6.5v6H4z" />
  </>
);

export const OrganizationIcon = createIcon(
  <>
    <path d="M3.5 20.5h17" />
    <path d="M5.5 20.5V7.5l6.5-3 6.5 3v13" />
    <path d="M9 20.5v-5h6v5" />
    <path d="M8.5 10.5h.01" />
    <path d="M12 10.5h.01" />
    <path d="M15.5 10.5h.01" />
  </>
);

export const UsersIcon = createIcon(
  <>
    <path d="M16.5 20a4.5 4.5 0 0 0-9 0" />
    <path d="M12 12.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
    <path d="M19.5 19a3.5 3.5 0 0 0-3-3.46" />
    <path d="M16.5 5.7a3.5 3.5 0 0 1 0 6.6" />
  </>
);

export const GroupsIcon = createIcon(
  <>
    <path d="M7.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path d="M16.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path d="M12 18.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M3.5 20a4 4 0 0 1 8 0" />
    <path d="M12.5 20a4.5 4.5 0 0 1 9 0" />
  </>
);

export const ApplicationsIcon = createIcon(
  <>
    <rect x="6" y="3.5" width="12" height="17" rx="2.5" />
    <path d="M10 6.5h4" />
    <path d="M11 17.5h2" />
  </>
);

export const RolesIcon = createIcon(
  <>
    <path d="m12 3.5 6.5 2.5v5c0 4-2.5 7.5-6.5 9-4-1.5-6.5-5-6.5-9v-5Z" />
    <path d="m9.5 12 1.6 1.6 3.4-3.6" />
  </>
);

export const AuditIcon = createIcon(
  <>
    <path d="M7 4.5h10" />
    <path d="M7 9.5h10" />
    <path d="M7 14.5h6" />
    <path d="M5.5 20.5h13a1 1 0 0 0 1-1v-15a1 1 0 0 0-1-1h-13a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1Z" />
  </>
);

export const MailIcon = createIcon(
  <>
    <path d="M4.5 6.5h15a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16V8a1.5 1.5 0 0 1 1.5-1.5Z" />
    <path d="m4 8 8 6 8-6" />
  </>
);

export const SecurityIcon = createIcon(
  <>
    <path d="m12 3.5 7 2.7v5.2c0 4.2-2.7 8-7 9.9-4.3-1.9-7-5.7-7-9.9V6.2l7-2.7Z" />
    <path d="M9.8 11.9h4.4" />
    <path d="M12 9.8v4.2" />
  </>
);

export const SettingsIcon = createIcon(
  <>
    <path d="M10.5 3.8h3l.6 2.2 2.1.9 2-1.1 2.1 2.1-1.1 2 .9 2.1 2.2.6v3l-2.2.6-.9 2.1 1.1 2-2.1 2.1-2-1.1-2.1.9-.6 2.2h-3l-.6-2.2-2.1-.9-2 1.1-2.1-2.1 1.1-2-.9-2.1-2.2-.6v-3l2.2-.6.9-2.1-1.1-2L5 5.8l2 1.1 2.1-.9.6-2.2Z" />
    <circle cx="12" cy="12" r="2.7" />
  </>
);

export const BellIcon = createIcon(
  <>
    <path d="M18 9.5a6 6 0 1 0-12 0c0 4-1.5 5.5-2.5 6.5h17c-1-1-2.5-2.5-2.5-6.5Z" />
    <path d="M10 19a2.2 2.2 0 0 0 4 0" />
  </>
);

export const ChevronDownIcon = createIcon(<path d="m6 9 6 6 6-6" />);

export const SearchIcon = createIcon(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </>
);

export const MenuIcon = createIcon(
  <>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </>
);

export const PlusIcon = createIcon(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>
);

export const CopyIcon = createIcon(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </>
);

export const ArrowLeftIcon = createIcon(
  <>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </>
);

export const CheckIcon = createIcon(<path d="m5 12.5 4.2 4 9.3-9.5" />);

export const XIcon = createIcon(
  <>
    <path d="m6 6 12 12" />
    <path d="M18 6 6 18" />
  </>
);

export const LogoutIcon = createIcon(
  <>
    <path d="M10 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h4" />
    <path d="M14 16.5 19 12l-5-4.5" />
    <path d="M19 12h-9" />
  </>
);

export const SparkIcon = createIcon(
  <>
    <path d="m12 3 1.4 4.1L17.5 8l-4.1 1.4L12 13.5l-1.4-4.1L6.5 8l4.1-.9Z" />
    <path d="m18 14 1 2.8 2.8 1-2.8 1-1 2.7-1-2.7-2.7-1 2.7-1Z" />
  </>
);

export function ProductMark({ className = 'h-8 w-8' }) {
  return (
    <img src={productLogo} alt={`${PRODUCT_NAME} logo`} className={className} />
  );
}
