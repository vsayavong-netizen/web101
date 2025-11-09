import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

// Heroicons v2, typically used as 24x24 outline
const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.5,
  stroke: "currentColor"
};

// Helper to extract sx and convert to style
const createIconComponent = (path: React.ReactNode) => {
  return React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }>(({ sx, ...props }, ref) => {
    if (sx) {
      return (
        <Box component="svg" ref={ref} {...iconProps} {...props} sx={sx}>
          {path}
        </Box>
      );
    }
    return <svg ref={ref} {...iconProps} {...props}>{path}</svg>;
  });
};

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
};
export const ArrowRightOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
);
export const BuildingLibraryIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>;
};
export const ArrowDownTrayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
);
export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.95-4.243l-1.59-1.591M3.75 12H3m4.243-4.95l-1.59-1.591M12 6.75A5.25 5.25 0 006.75 12a5.25 5.25 0 005.25 5.25 5.25 5.25 0 005.25-5.25A5.25 5.25 0 0012 6.75z" /></svg>
);
export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
);
export const AcademicCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path d="M12 14.25c-4.97 0-9-1.12-9-2.5V10.5c0-1.38 4.03-2.5 9-2.5s9 1.12 9 2.5v1.25c0 1.38-4.03 2.5-9 2.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25L12 18.75M12 14.25a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25v0a2.25 2.25 0 012.25 2.25v5.25a2.25 2.25 0 01-2.25 2.25v0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25v0a2.25 2.25 0 012.25 2.25v9.75A2.25 2.25 0 0112 18.75z" /><path d="M12 14.25c-4.97 0-9-1.12-9-2.5V10.5c0-1.38 4.03-2.5 9-2.5s9 1.12 9 2.5v1.25c0 1.38-4.03 2.5-9 2.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.57-1.023.995-2.148 1.255-3.376m-1.255 3.376L3 18.72m12.75-2.962c.26-.621.455-1.28.586-1.976m.586-1.976l-.61-.61a3.75 3.75 0 00-5.304-5.304l-.61.61m0 0l-6.75-6.75m6.75 6.75L3 3m6 6c-1.373 0-2.5 1.127-2.5 2.5S7.627 11 9 11s2.5-1.127 2.5-2.5S10.373 6 9 6z" /></svg>
);
export const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
);
export const BuildingOfficeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375a.625.625 0 01.625.625v3.375a.625.625 0 01-.625.625H9v-4.625zM9.75 6.75v4.625m6-4.625v4.625" /></svg>
);
export const CalendarPlusIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
};
export const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
);
export const TableCellsIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM3.75 12h16.5m-16.5 0v6.75m16.5-6.75v6.75m0-6.75H3.75M6.75 20.25h10.5M9 3.75v16.5M15 3.75v16.5" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM3.75 12h16.5m-16.5 0v6.75m16.5-6.75v6.75m0-6.75H3.75M6.75 20.25h10.5M9 3.75v16.5M15 3.75v16.5" /></svg>;
};
export const ClipboardDocumentCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" /></svg>
);
export const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
};
export const ChartPieIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>;
};
export const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>;
};
export const InboxStackIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.12-1.588H6.88a2.25 2.25 0 00-2.12 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.12-1.588H6.88a2.25 2.25 0 00-2.12 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" /></svg>;
};
export const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
);
export const ClipboardDocumentListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.662V18a2.25 2.25 0 002.25 2.25h1.5M12 4.5A2.25 2.25 0 0114.25 2.25h1.5A2.25 2.25 0 0118 4.5v2.25m-6-4.5v2.25m0-2.25h-5.25A2.25 2.25 0 002.25 4.5v13.5A2.25 2.25 0 004.5 20.25h5.25" /></svg>
);
export const DocumentCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
export const PencilSquareIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
};
export const Cog6ToothIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.003 1.11-1.226M12 20.25v-2.25m-3.866-4.25a7.5 7.5 0 1011.632-4.25 7.5 7.5 0 00-11.632 4.25zM12 18a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.75 0v1.5c0 .207.168.375.375.375z" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.003 1.11-1.226M12 20.25v-2.25m-3.866-4.25a7.5 7.5 0 1011.632-4.25 7.5 7.5 0 00-11.632 4.25zM12 18a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.75 0v1.5c0 .207.168.375.375.375z" /></svg>;
};
export const CalendarDaysIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 11.25h.008v.008H12v-.008z" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 11.25h.008v.008H12v-.008z" /></svg>;
};
export const DocumentChartBarIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
};
export const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
);
export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement> & { sx?: SxProps<Theme> }> = ({ sx, className, ...props }) => {
  if (sx) {
    return (
      <Box component="svg" {...iconProps} {...props} sx={sx} className={undefined}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.25 21l-.648-.428a2.25 2.25 0 01-1.47-2.47l.428-1.594a2.25 2.25 0 012.47-1.47l1.594.428a2.25 2.25 0 011.47 2.47l-.428 1.594a2.25 2.25 0 01-2.47 1.47z" />
      </Box>
    );
  }
  return <svg {...iconProps} {...props} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.25 21l-.648-.428a2.25 2.25 0 01-1.47-2.47l.428-1.594a2.25 2.25 0 012.47-1.47l1.594.428a2.25 2.25 0 011.47 2.47l-.428 1.594a2.25 2.25 0 01-2.47 1.47z" /></svg>;
};
export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
);
export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
export const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
);
export const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
export const CheckCircleSolidIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
);
export const MagnifyingGlassIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
);
export const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
);
export const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
);
export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09a2.09 2.09 0 00-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);
export const PaperAirplaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
);
export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
export const DocumentArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
);
export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-3.181-1.162a8.25 8.25 0 00-11.664 0l-3.181 3.183" /></svg>
);
export const ArrowsRightLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18m-7.5-14L21 6.5m0 0L16.5 12M21 6.5H3" /></svg>
);
export const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
);
export const PaperClipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 1118.375 9.09l-10.94 10.94a2.25 2.25 0 01-3.182-3.182m5.526-1.353l3.182 3.182" /></svg>
);
export const Bars3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
);
export const ArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
);
export const ArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
);
export const ChevronUpDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>
);
export const ChatBubbleBottomCenterTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-0.417m-10.74-3.92l-.01-.01A9.755 9.755 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
);
export const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
);
export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
);
export const LightBulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.184m-1.5.184a6.01 6.01 0 01-1.5-.184m3 7.425a6.01 6.01 0 01-3 0m3 0a6.01 6.01 0 003 0m-3 0a6.01 6.01 0 01-3 0m0 0a6.01 6.01 0 00-3 0m6 0a6.01 6.01 0 003 0m-6 0a6.01 6.01 0 01-3 0m0 0c-1.296 0-2.484-.21-3.627-.611m12.254 0c-1.143.401-2.331.611-3.627.611M12 3a9 9 0 00-9 9c0 2.398.905 4.646 2.458 6.331m13.084-6.331A9 9 0 0012 3z" /></svg>
);
export const QuestionMarkCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
);
export const InboxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M2.25 9.75h19.5v5.625c0 .621-.504 1.125-1.125 1.125H3.375A1.125 1.125 0 012.25 15.375V9.75z" /></svg>
);
export const HeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
);
export const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);
export const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
);
export const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
export const InformationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
);
export const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...iconProps} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);