import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import {
  Home,
  Users,
  Package,
  FileText,
  Truck,
  Calendar,
  Settings,
  LogOut,
  Shield,
  ChevronDown,
  DollarSign,
  Building,
  Menu,
  X,
  AlertCircle,
  MoreHorizontal,
  ClipboardList } from
'lucide-react';

const TopNavigation = () => {
  const { user, logout, isAdmin, isManager, isAuthenticated, isLoading, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Debug logging
  useEffect(() => {
    if (debugMode) {
      console.log('TopNavigation Debug:', {
        isAuthenticated,
        isLoading,
        isInitialized,
        user: user?.Name,
        userRole: user ? isAdmin() ? 'Admin' : isManager() ? 'Manager' : 'Employee' : 'None'
      });
    }
  }, [isAuthenticated, isLoading, isInitialized, user, isAdmin, isManager, debugMode]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Primary navigation items - always visible in main nav
  const primaryNavItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    requiredRole: null
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    requiredRole: null
  },
  {
    name: 'Sales',
    href: '/sales',
    icon: FileText,
    requiredRole: null
  },
  {
    name: 'Delivery',
    href: '/delivery',
    icon: Truck,
    requiredRole: null
  },
  {
    name: 'Employee',
    href: '/employees',
    icon: Users,
    requiredRole: 'manager'
  }];


  // Secondary navigation items - shown in "More Menu" dropdown
  const secondaryNavItems = [
  {
    name: 'Vendor',
    href: '/vendors',
    icon: Building,
    requiredRole: 'manager'
  },
  {
    name: 'Order',
    href: '/orders',
    icon: ClipboardList,
    requiredRole: 'manager'
  },
  {
    name: 'Licenses',
    href: '/licenses',
    icon: Calendar,
    requiredRole: 'manager'
  },
  {
    name: 'Salary',
    href: '/salary',
    icon: DollarSign,
    requiredRole: 'manager'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredRole: null
  }];


  // Add admin section if user is admin
  if (isAuthenticated && isAdmin()) {
    secondaryNavItems.push({
      name: 'Admin',
      href: '/admin',
      icon: Shield,
      requiredRole: 'admin'
    });
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActiveRoute = (href: string) => {
    return location.pathname.startsWith(href);
  };

  // Enhanced role checking with better fallbacks
  const canAccessRoute = (requiredRole: string | null) => {
    // Allow access if no role is required
    if (!requiredRole) return true;

    // Ensure user is authenticated
    if (!isAuthenticated) return false;

    // Check specific roles
    if (requiredRole === 'admin') return isAdmin();
    if (requiredRole === 'manager') return isManager();

    // Default to allowing access for authenticated users
    return true;
  };

  // Get accessible items for debugging
  const accessiblePrimaryItems = primaryNavItems.filter((item) => canAccessRoute(item.requiredRole));
  const accessibleSecondaryItems = secondaryNavItems.filter((item) => canAccessRoute(item.requiredRole));
  const allNavigationItems = [...primaryNavItems, ...secondaryNavItems];

  const NavigationLink = ({ item, mobile = false, dropdown = false }: {item: any;mobile?: boolean;dropdown?: boolean;}) => {
    if (!canAccessRoute(item.requiredRole)) return null;

    const Icon = item.icon;
    const isActive = isActiveRoute(item.href);

    const baseClasses = mobile ?
    "flex items-center space-x-3 px-4 py-3 text-left w-full transition-colors text-sm font-medium rounded-md mx-2" :
    dropdown ?
    "flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full" :
    "flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 whitespace-nowrap text-sm font-medium hover:scale-105 min-w-fit max-w-fit flex-shrink-0";

    const activeClasses = isActive ?
    "bg-blue-600 text-white shadow-md" :
    mobile ?
    "text-gray-700 hover:bg-gray-100 hover:text-gray-900" :
    dropdown ?
    "text-gray-700 hover:text-gray-900" :
    "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm";

    const handleClick = () => {
      navigate(item.href);
      if (mobile) setMobileMenuOpen(false);
    };

    if (dropdown) {
      return (
        <DropdownMenuItem onClick={handleClick} className={baseClasses}>
          <Icon className="mr-2 h-4 w-4" />
          {item.name}
        </DropdownMenuItem>);

    }

    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} ${activeClasses}`}
        data-testid={`nav-${item.name.toLowerCase()}`}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="ml-2">{item.name}</span>
      </button>);

  };

  // More Menu Dropdown Component
  const MoreMenuDropdown = () => {
    if (accessibleSecondaryItems.length === 0) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 whitespace-nowrap text-sm font-medium hover:scale-105 min-w-fit max-w-fit flex-shrink-0 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm">

            <MoreHorizontal className="h-4 w-4 flex-shrink-0" />
            <span className="ml-2">More Menu</span>
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          <DropdownMenuLabel>More Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {accessibleSecondaryItems.map((item) =>
          <NavigationLink key={item.href} item={item} dropdown />
          )}
        </DropdownMenuContent>
      </DropdownMenu>);

  };

  // Show loading state for navigation
  if (!isInitialized || isLoading) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img
                src="https://cdn.ezsite.ai/AutoDev/19016/c533e5f9-97eb-43d2-8be6-bcdff5709bba.png"
                alt="DFS Manager Portal"
                className="h-10 w-auto" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">DFS Manager Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>);

  }

  // Don't render navigation if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Fixed Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full shadow-sm">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="flex items-center justify-between h-16 min-w-0">
            
            {/* Left Section - Logo and Brand */}
            <div className="flex items-center space-x-4 flex-shrink-0 min-w-0">
              <img
                src="https://cdn.ezsite.ai/AutoDev/19016/c533e5f9-97eb-43d2-8be6-bcdff5709bba.png"
                alt="DFS Manager Portal"
                className="h-10 w-auto flex-shrink-0" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block truncate">DFS Manager Portal</span>
            </div>

            {/* Center Section - Navigation Items (Desktop) */}
            <nav className="hidden lg:flex items-center flex-1 justify-center min-w-0 mx-4">
              <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide max-w-full">
                {/* Primary Navigation Items */}
                {accessiblePrimaryItems.map((item) =>
                <NavigationLink key={item.href} item={item} />
                )}
                
                {/* More Menu Dropdown */}
                <MoreMenuDropdown />
              </div>
            </nav>

            {/* Right Section - User Profile and Controls */}
            <div className="flex items-center space-x-2 flex-shrink-0 min-w-0">
              
              {/* Debug Toggle (Development) */}
              {process.env.NODE_ENV === 'development' &&
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
                className="text-xs px-2 py-1">
                  {debugMode ? 'Debug: ON' : 'Debug: OFF'}
                </Button>
              }

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2 py-1.5 h-auto min-w-0 max-w-fit">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-700">
                        {user?.Name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="hidden xl:block text-left min-w-0 max-w-32">
                      <p className="text-sm font-medium text-gray-900 leading-none truncate">
                        {user?.Name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 leading-none mt-0.5 truncate">{user?.Email}</p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        {debugMode &&
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <div className="text-xs text-yellow-800">
              <strong>Debug:</strong> Auth: {isAuthenticated ? 'Yes' : 'No'} | 
              Primary: {accessiblePrimaryItems.length} | Secondary: {accessibleSecondaryItems.length} | 
              Role: {isAdmin() ? 'Admin' : isManager() ? 'Manager' : 'Employee'} | 
              User: {user?.Name || 'None'}
            </div>
          </div>
        }
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen &&
      <div className="lg:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)} />

          {/* Menu Panel */}
          <div className={`fixed top-0 right-0 w-80 max-w-[90vw] h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-hidden ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full max-h-full">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <img
                  src="https://cdn.ezsite.ai/AutoDev/19016/c533e5f9-97eb-43d2-8be6-bcdff5709bba.png"
                  alt="DFS Manager Portal"
                  className="h-8 w-auto flex-shrink-0" />
                  <span className="text-lg font-bold text-gray-900 truncate">DFS Manager Portal</span>
                </div>
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-shrink-0">
                  <X className="h-6 w-6" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              
              {/* Navigation Items */}
              <div className="flex-1 py-4 overflow-y-auto min-h-0">
                <div className="space-y-2 px-2">
                  {/* Primary Navigation Items */}
                  {accessiblePrimaryItems.map((item) =>
                <NavigationLink key={item.href} item={item} mobile />
                )}
                  
                  {/* Divider */}
                  {accessibleSecondaryItems.length > 0 &&
                <div className="border-t border-gray-200 my-4 mx-2"></div>
                }
                  
                  {/* Secondary Navigation Items */}
                  {accessibleSecondaryItems.map((item) =>
                <NavigationLink key={item.href} item={item} mobile />
                )}
                </div>
              </div>
              
              {/* User Section */}
              <div className="border-t p-4 bg-gray-50 flex-shrink-0">
                <div className="flex items-center space-x-3 mb-4 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-blue-700">
                      {user?.Name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.Name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.Email}</p>
                  </div>
                </div>
                <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    </>);

};

export default TopNavigation;