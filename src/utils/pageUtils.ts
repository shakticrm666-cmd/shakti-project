import { useEffect } from 'react';

export interface PageConfig {
  title: string;
  description: string;
  keywords?: string;
}

export const PAGE_CONFIGS: Record<string, PageConfig> = {
  login: {
    title: 'Login - Shakti CRM',
    description: 'Login to Shakti Customer Relationship Management System. Access your dashboard based on your role.',
    keywords: 'login, crm, customer management, authentication'
  },
  superadmin: {
    title: 'Super Admin Dashboard - Shakti CRM',
    description: 'Super Administrator dashboard for managing tenants, companies, and system-wide settings in Shakti CRM.',
    keywords: 'super admin, dashboard, tenant management, system administration, crm'
  },
  companyadmin: {
    title: 'Company Admin Dashboard - Shakti CRM',
    description: 'Company Administrator dashboard for managing employees, customers, and business operations in Shakti CRM.',
    keywords: 'company admin, dashboard, employee management, customer management, crm'
  },
  teamincharge: {
    title: 'Team Incharge Dashboard - Shakti CRM',
    description: 'Team Incharge dashboard for supervising telecallers and managing customer cases in Shakti CRM.',
    keywords: 'team incharge, dashboard, team management, customer cases, crm'
  },
  telecaller: {
    title: 'Telecaller Dashboard - Shakti CRM',
    description: 'Telecaller dashboard for managing customer calls, cases, and follow-ups in Shakti CRM.',
    keywords: 'telecaller, dashboard, customer calls, case management, crm'
  }
};

export const usePageConfig = (pageKey: string, customTitle?: string) => {
  useEffect(() => {
    const config = PAGE_CONFIGS[pageKey];
    if (config) {
      // Set page title
      document.title = customTitle || config.title;

      // Update meta description
      updateMetaTag('description', config.description);

      // Update meta keywords if provided
      if (config.keywords) {
        updateMetaTag('keywords', config.keywords);
      }

      // Update Open Graph tags for social sharing
      updateMetaTag('property:og:title', customTitle || config.title, 'property');
      updateMetaTag('property:og:description', config.description, 'property');
      updateMetaTag('property:og:type', 'website', 'property');

      // Update Twitter Card tags
      updateMetaTag('name:twitter:title', customTitle || config.title, 'name');
      updateMetaTag('name:twitter:description', config.description, 'name');
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Shakti CRM';
    };
  }, [pageKey, customTitle]);
};

const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

  if (element) {
    element.content = content;
  } else {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    element.content = content;
    document.getElementsByTagName('head')[0].appendChild(element);
  }
};

export const getRoleDisplayName = (role?: string): string => {
  switch (role) {
    case 'SuperAdmin': return 'Super Administrator';
    case 'CompanyAdmin': return 'Company Administrator';
    case 'TeamIncharge': return 'Team Incharge';
    case 'Telecaller': return 'Telecaller';
    default: return 'User';
  }
};

export const getRoleBasedTitle = (role?: string, tenantName?: string): string => {
  const roleName = getRoleDisplayName(role);
  const baseTitle = `${roleName} Dashboard`;

  if (tenantName && role !== 'SuperAdmin') {
    return `${baseTitle} - ${tenantName}`;
  }

  return baseTitle;
};