export type PrimaryNavKey = 'home' | 'search' | 'favorites' | 'assistant' | 'profile';

export type TopNavActionsSlot = 'default' | 'auth-sign-in' | 'auth-sign-up';

export interface RoutePresentation {
  title: string;
  primaryNavKey: PrimaryNavKey;
  showDesktopTopNav: boolean;
  showDesktopSidebar: boolean;
  topNavActionsSlot: TopNavActionsSlot;
}

export interface PrimaryNavItem {
  key: PrimaryNavKey;
  href: string;
  label: string;
}

export const primaryNavItems: PrimaryNavItem[] = [
  { key: 'home', href: '/', label: 'Home' },
  { key: 'search', href: '/search?browse=true', label: 'Search' },
  { key: 'favorites', href: '/favorites', label: 'Favorites' },
  { key: 'assistant', href: '/ai-assistant', label: 'Assistant' },
  { key: 'profile', href: '/profile', label: 'Profile' }
];

export function getRoutePresentation(pathname: string): RoutePresentation {
  if (pathname.startsWith('/sign-in')) {
    return {
      title: 'Sign In',
      primaryNavKey: 'profile',
      showDesktopTopNav: true,
      showDesktopSidebar: false,
      topNavActionsSlot: 'auth-sign-up'
    };
  }

  if (pathname.startsWith('/sign-up')) {
    return {
      title: 'Sign Up',
      primaryNavKey: 'profile',
      showDesktopTopNav: true,
      showDesktopSidebar: false,
      topNavActionsSlot: 'auth-sign-in'
    };
  }

  if (pathname === '/') {
    return {
      title: 'Home',
      primaryNavKey: 'home',
      showDesktopTopNav: true,
      showDesktopSidebar: true,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/search/categories')) {
    return {
      title: 'Categories',
      primaryNavKey: 'search',
      showDesktopTopNav: true,
      showDesktopSidebar: true,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/search')) {
    return {
      title: 'Search',
      primaryNavKey: 'search',
      showDesktopTopNav: true,
      showDesktopSidebar: true,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/favorites')) {
    return {
      title: 'Favorites',
      primaryNavKey: 'favorites',
      showDesktopTopNav: true,
      showDesktopSidebar: true,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/ai-assistant')) {
    return {
      title: 'AI Assistant',
      primaryNavKey: 'assistant',
      showDesktopTopNav: true,
      showDesktopSidebar: true,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/profile')) {
    return {
      title: 'Profile',
      primaryNavKey: 'profile',
      showDesktopTopNav: true,
      showDesktopSidebar: true,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/help')) {
    return {
      title: 'Help & Support',
      primaryNavKey: 'profile',
      showDesktopTopNav: true,
      showDesktopSidebar: true,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/about')) {
    return {
      title: 'About Qemat',
      primaryNavKey: 'profile',
      showDesktopTopNav: true,
      showDesktopSidebar: true,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/add-price')) {
    return {
      title: 'Add/Update Price',
      primaryNavKey: 'profile',
      showDesktopTopNav: true,
      showDesktopSidebar: false,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/store/')) {
    return {
      title: 'Store Profile',
      primaryNavKey: 'search',
      showDesktopTopNav: true,
      showDesktopSidebar: false,
      topNavActionsSlot: 'default'
    };
  }

  if (pathname.startsWith('/product/')) {
    return {
      title: 'Product Details',
      primaryNavKey: 'search',
      showDesktopTopNav: true,
      showDesktopSidebar: false,
      topNavActionsSlot: 'default'
    };
  }

  return {
    title: 'Qemat',
    primaryNavKey: 'home',
    showDesktopTopNav: true,
    showDesktopSidebar: true,
    topNavActionsSlot: 'default'
  };
}
