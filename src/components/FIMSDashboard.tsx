import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ArrowLeft, Camera, BarChart3, FileText, Plus, Search, Filter, Download, RefreshCw, Eye, CreditCard as Edit, Trash2, MapPin, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, TrendingUp, Target, X, User, ChevronDown, Settings, LogOut, Menu, Chrome as Home, PieChart, Globe, Check, ChevronLeft, ChevronRight, Activity, Package, Users, Award, Zap, Layers, TrendingDown } from 'lucide-react';
import {
  fetchInspectionStats,
  getInspections,
  fetchCategories,
  fetchInspectors,
  deleteInspection,
  reassignInspection,
  updateInspectionStatus,
  type InspectionStats,
  type InspectionData,
  type CategoryData,
  type InspectorData
} from '../services/fimsService';
import { usePermissions } from '../hooks/usePermissions';
import { FIMSAnalytics } from './FIMSAnalytics';
import { FIMSNewInspection } from './FIMSNewInspection';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Mobile detection utility
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

interface FIMSDashboardProps {
  user: SupabaseUser;
  onSignOut: () => void;
}

interface Inspection {
  id: string;
  inspection_number: string;
  category_id: string;
  inspector_id: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  planned_date: string | null;
  inspection_date: string | null;
  status: string;
  form_data: any;
  is_compliant: boolean | null;
  requires_revisit: boolean;
  created_at: string;
  updated_at: string;
  filled_by_name?: string | null;
  anganwadi_forms?: any;
  photos?: InspectionPhoto[];
}

interface Category {
  id: string;
  name: string;
  name_marathi: string;
  description: string;
  form_type: string;
  is_active: boolean;
}

interface InspectionPhoto {
  id: string;
  photo_url: string;
  photo_name: string | null;
  description: string | null;
  photo_order: number;
  uploaded_at: string;
}

export const FIMSDashboard: React.FC<FIMSDashboardProps> = ({ user, onSignOut }) => {
  const { t, i18n } = useTranslation();
  const { userRole, userProfile, isLoading: isLoadingRole } = usePermissions(user);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isLoading, setIsLoading] = useState(false);
  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [inspectors, setInspectors] = useState<InspectorData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({
    inspectionNumber: '',
    location: '',
    category: '',
    status: '',
    date: '',
    filled_by_name: ''
  });
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [viewingPhotos, setViewingPhotos] = useState<InspectionPhoto[]>([]);
  const [editingInspection, setEditingInspection] = useState<InspectionData | null>(null);
  const [showRevisitModal, setShowRevisitModal] = useState(false);
  const [revisitInspectionId, setRevisitInspectionId] = useState<string>('');
  const [availableInspectors, setAvailableInspectors] = useState<any[]>([]);
  const [selectedInspector, setSelectedInspector] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileState, setIsMobileState] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth <= 768;
      setIsMobileState(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isLoadingRole) {
      fetchAllData();
    }
  }, [isLoadingRole, userRole]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showPhotoModal && viewingPhotos.length > 0) {
        if (e.key === 'ArrowLeft' && selectedPhotoIndex > 0) {
          setSelectedPhotoIndex(selectedPhotoIndex - 1);
        } else if (e.key === 'ArrowRight' && selectedPhotoIndex < viewingPhotos.length - 1) {
          setSelectedPhotoIndex(selectedPhotoIndex + 1);
        } else if (e.key === 'Escape') {
          setShowPhotoModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPhotoModal, selectedPhotoIndex, viewingPhotos.length]);

  const viewingInspection = editingInspection?.mode === 'view';

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [inspectionsData, categoriesData, inspectorsData] = await Promise.all([
        getInspections(user.id, userRole || undefined),
        fetchCategories(),
        fetchInspectors()
      ]);

      setInspections(inspectionsData);
      setCategories(categoriesData);
      setAvailableInspectors(inspectorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInspectionsData = async () => {
    try {
      console.log('🔍 Fetching inspections...');
      
      const { supabase } = await import('../lib/supabase');
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('fims_inspections')
        .select(`
          *,
          fims_categories(name, name_marathi),
          fims_anganwadi_forms(*),
          fims_office_inspection_forms(*),
          fims_inspection_photos(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Inspections fetched successfully:', data?.length || 0);
      setInspections(data || []);
    } catch (error) {
      console.error('❌ Error in fetchInspections:', error);
      
      if (error.message.includes('Failed to fetch')) {
        alert('Network connection error. Please check your internet connection and try again.');
      } else if (error.message.includes('JWT')) {
        alert('Session expired. Please sign in again.');
      } else {
        alert(`Error loading inspections: ${error.message}`);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      if (supabase) await supabase.auth.signOut();
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteInspection = async (inspectionId: string) => {
    if (!confirm(t('fims.confirmDeleteInspection') || 'Are you sure you want to delete this inspection?')) return;

    try {
      setIsLoading(true);
      await deleteInspection(inspectionId);
      alert(t('fims.inspectionDeletedSuccessfully') || 'Inspection deleted successfully');
      await fetchInspectionsData();
    } catch (error) {
      console.error('Error deleting inspection:', error);
      alert(t('fims.errorDeletingInspection') || 'Error deleting inspection: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteInspection = async (inspectionId: string) => {
    try {
      const { supabase } = await import('../lib/supabase');
      if (!supabase) return;

      const { error } = await supabase
        .from('fims_inspections')
        .update({ status: 'approved' })
        .eq('id', inspectionId);
      
      if (error) throw error;
      
      await fetchInspectionsData();
      alert('Inspection marked as completed');
    } catch (error) {
      console.error('Error completing inspection:', error);
      alert('Error completing inspection: ' + error.message);
    }
  };

  const handleRevisitInspection = (inspectionId: string) => {
    setRevisitInspectionId(inspectionId);
    setSelectedInspector('');
    setShowRevisitModal(true);
  };

  const handleConfirmRevisit = async () => {
    if (!selectedInspector) {
      alert('Please select an inspector for revisit');
      return;
    }

    try {
      setIsLoading(true);
      await reassignInspection(revisitInspectionId, selectedInspector);
      alert('Inspection assigned for revisit successfully');
      setShowRevisitModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Error sending for revisit:', error);
      alert('Error sending for revisit: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInspectionPhotos = async (inspection: Inspection) => {
    try {
      const { supabase } = await import('../lib/supabase');
      if (!supabase) return;

      const { data, error } = await supabase
        .from('fims_inspection_photos')
        .select('*')
        .eq('inspection_id', inspection.id)
        .order('photo_order');

      if (error) throw error;
      
      if (!data || data.length === 0) {
        alert(t('fims.noPhotosFound', 'No photos found for this inspection'));
        return;
      }
      
      setViewingPhotos(data || []);
      setSelectedPhotoIndex(0);
      setShowPhotoModal(true);
    } catch (error) {
      console.error('Error loading photos:', error);
      alert('Error loading photos: ' + error.message);
    }
  };

  const getFilteredInspections = () => {
    return inspections.filter(inspection => {
      const matchesSearch = searchTerm === '' ||
        inspection.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.inspection_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === '' || inspection.category_id === selectedCategory;
      const matchesStatus = selectedStatus === '' || inspection.status === selectedStatus;

      const matchesInspectionNumber = columnFilters.inspectionNumber === '' ||
        inspection.inspection_number?.toLowerCase().includes(columnFilters.inspectionNumber.toLowerCase());

      const matchesLocation = columnFilters.location === '' ||
        inspection.location_name?.toLowerCase().includes(columnFilters.location.toLowerCase());

      const category = categories.find(c => c.id === inspection.category_id);
      const categoryName = category ? t(`categories.${category.form_type}`, category.name) : '';
      const matchesCategoryFilter = columnFilters.category === '' ||
        categoryName.toLowerCase().includes(columnFilters.category.toLowerCase());

      const matchesStatusFilter = columnFilters.status === '' ||
        getStatusText(inspection.status).toLowerCase().includes(columnFilters.status.toLowerCase());

      const inspectionDate = inspection.inspection_date || inspection.planned_date;
      const matchesDateFilter = columnFilters.date === '' ||
        (inspectionDate && new Date(inspectionDate).toLocaleDateString().includes(columnFilters.date));

      const matchesFilledBy = !columnFilters.filled_by_name || 
        inspection.filled_by_name?.toLowerCase().includes(columnFilters.filled_by_name.toLowerCase());

      return matchesSearch && matchesCategory && matchesStatus &&
             matchesInspectionNumber && matchesLocation && matchesCategoryFilter &&
             matchesStatusFilter && matchesDateFilter && matchesFilledBy;
    });
  };

  const getStatusCounts = () => {
    const total = inspections.length;
    const pending = inspections.filter(i => ['planned', 'in_progress', 'draft'].includes(i.status)).length;
    const completed = inspections.filter(i => i.status === 'approved').length;
    const submitted = inspections.filter(i => i.status === 'submitted').length;
    
    return { total, pending, completed, submitted };
  };

  const getCompletionRate = () => {
    const { total, completed } = getStatusCounts();
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      case 'submitted':
      case 'under_review':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'draft':
      case 'pending':
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
      case 'rejected':
        return 'bg-gradient-to-r from-rose-500 to-red-500 text-white';
      case 'reassigned':
        return 'bg-gradient-to-r from-violet-500 to-purple-500 text-white';
      default:
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    return t(`statuses.${status}`, status.toUpperCase());
  };

  // Mobile navigation items
  const mobileNavItems = [
    {
      id: 'dashboard',
      icon: Home,
      title: t('fims.dashboard'),
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      id: 'inspections',
      icon: FileText,
      title: t('fims.inspections'),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'newInspection',
      icon: Plus,
      title: t('fims.newInspection'),
      gradient: 'from-emerald-500 to-teal-500'
    }
  ];

  const renderMobileNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 px-4 py-3 z-50 md:hidden">
      <div className="flex justify-around items-center">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`relative flex flex-col items-center space-y-1.5 px-4 py-2 rounded-2xl transition-all duration-300 ${
              activeTab === item.id
                ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg shadow-${item.gradient.split('-')[1]}-500/30`
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {activeTab === item.id && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full"></div>
            )}
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-semibold">{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMobileHeader = () => (
    <div className="sticky top-0 z-50 relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-4 py-5 md:hidden overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl"></div>
            <img src="/Zpchandrapurlogo.png" alt="FIMS Logo" className="relative h-14 w-14 object-contain drop-shadow-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white drop-shadow-lg">FIMS</h1>
            <p className="text-xs text-white/90 font-medium">Field Inspection</p>
          </div>
        </div>
        
        <div className="relative z-50">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="p-2.5 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-xl transition-all duration-300"
          >
            <User className="h-5 w-5 text-white" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-[100]">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-violet-500 to-purple-500 p-3 rounded-xl">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      {userProfile?.name || user.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-600">
                      {userProfile?.role_name || 'User'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <button className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{t('profile.userProfile')}</span>
                </button>
                <button className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">{t('navigation.settings')}</span>
                </button>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-semibold">{t('auth.signOut')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'analytics') {
    return (
      <FIMSAnalytics
        user={user}
        onBack={() => setActiveTab('dashboard')}
      />
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Images Section */}
      {/* <div className="relative overflow-hidden rounded-3xl mb-8 z-0">
        <div className="flex animate-scroll">
          {[
            '/files_6345612-1761837302350-image.png',
            '/files_6345612-1761837310931-image.png',
            '/files_6345612-1761837319198-image.png',
            '/files_6345612-1761837326121-image.png'
          ].map((src, idx) => (
            <div key={`first-${idx}`} className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 group w-80 mx-2 flex-shrink-0">
              <img
                src={src}
                alt={`Dashboard Image ${idx + 1}`}
                className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-sm font-bold">Field Inspection Site</p>
              </div>
            </div>
          ))}
          {[
            '/files_6345612-1761837302350-image.png',
            '/files_6345612-1761837310931-image.png',
            '/files_6345612-1761837319198-image.png',
            '/files_6345612-1761837326121-image.png'
          ].map((src, idx) => (
            <div key={`second-${idx}`} className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 group w-80 mx-2 flex-shrink-0">
              <img
                src={src}
                alt={`Dashboard Image ${idx + 1}`}
                className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            </div>
          ))}
        </div>
      </div> */}

      {/* KPI Cards with Glassmorphism */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          {
            title: t('fims.totalInspections'),
            value: getStatusCounts().total,
            icon: Package,
            gradient: 'from-blue-500 to-cyan-500',
            lightGradient: 'from-blue-500/10 to-cyan-500/10'
          },
          {
            title: t('fims.completed'),
            value: getStatusCounts().completed,
            icon: CheckCircle,
            gradient: 'from-emerald-500 to-teal-500',
            lightGradient: 'from-emerald-500/10 to-teal-500/10'
          },
          {
            title: t('fims.pending'),
            value: getStatusCounts().pending,
            icon: Clock,
            gradient: 'from-amber-500 to-orange-500',
            lightGradient: 'from-amber-500/10 to-orange-500/10'
          },
          {
            title: t('fims.successRate'),
            value: `${getCompletionRate()}%`,
            icon: TrendingUp,
            gradient: 'from-violet-500 to-purple-500',
            lightGradient: 'from-violet-500/10 to-purple-500/10'
          }
        ].map((card, idx) => (
          <div
            key={idx}
            className="group relative bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.lightGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            ></div>

            <div className="relative flex items-center gap-3">
              {/* ICON */}
              <div className={`p-2 bg-gradient-to-br ${card.gradient} rounded-xl shadow-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>

              {/* TEXT + VALUE */}
              <div className="flex flex-col justify-center">
                <p className="text-sm font-semibold text-gray-600 leading-tight">{card.title}</p>
                <p className="text-xl font-black text-gray-900 leading-tight">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Quick Actions with Gradient Cards */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900 flex items-center">
            <Zap className="h-7 w-7 mr-3 text-violet-600" />
            {t('fims.quickActions')}
          </h3>
        </div>
        
        <div className={`grid grid-cols-1 ${userRole === 'developer' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          <button
            onClick={() => setActiveTab('newInspection')}
            className="group relative bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-6 rounded-2xl transition-all duration-300 flex items-center space-x-4 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white/20 p-3 rounded-xl">
              <Plus className="h-6 w-6" />
            </div>
            <span className="relative font-bold text-lg">{t('fims.newInspection')}</span>
          </button>

          <button
            onClick={() => setActiveTab('inspections')}
            className="group relative bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-6 rounded-2xl transition-all duration-300 flex items-center space-x-4 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white/20 p-3 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <span className="relative font-bold text-lg">{t('fims.inspections')}</span>
          </button>

          {userRole === 'developer' && (
            <button
              onClick={() => setActiveTab('analytics')}
              className="group relative bg-gradient-to-br from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white p-6 rounded-2xl transition-all duration-300 flex items-center space-x-4 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/20 p-3 rounded-xl">
                <PieChart className="h-6 w-6" />
              </div>
              <span className="relative font-bold text-lg">{t('fims.analytics')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-transparent">
          <h3 className="text-2xl font-black text-gray-900 flex items-center">
            <Layers className="h-7 w-7 mr-3 text-gray-700" />
            {t('fims.recentInspections')}
          </h3>
        </div>
        
        <div className="overflow-x-auto overflow-y-auto hidden md:block scrollbar-custom" style={{ maxHeight: '600px' }}>
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50/50 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
              <tr>
                {[
                  { key: 'inspectionNumber', label: t('fims.inspectionNumber'), width: '15%' },
                  { key: 'location', label: t('fims.location'), width: '22%', maxWidth: '10px' },
                  { key: 'category', label: t('fims.category'), width: '22%' },
                  { key: 'status', label: t('fims.status'), width: '15%' },
                  { key: 'date', label: t('fims.date'), width: '13%' },
                  { key: 'actions', label: t('fims.actions'), width: '13%' }
                ].map((col, idx) => (
                  <th key={idx} className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-[${col.width}]`}>
                    <div className="flex items-center space-x-2">
                      <span>{col.label}</span>
                    </div>
                    {col.key !== 'actions' && (
                      <input
                        type="text"
                        placeholder={t('common.filter...', 'Filter...')}
                        value={columnFilters[col.key as keyof typeof columnFilters]}
                        onChange={(e) => setColumnFilters({...columnFilters, [col.key]: e.target.value})}
                        className="mt-2 w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-900 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {getFilteredInspections().map((inspection, idx) => {
                const category = categories.find(c => c.id === inspection.category_id);
                return (
                  <tr key={inspection.id} className="hover:bg-gray-50/50 transition-colors backdrop-blur-sm">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 truncate">
                      {inspection.inspection_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      <div className="overflow-x-auto scrollbar-custom" style={{ maxWidth: '310px' }}>
                        <div className="whitespace-nowrap">
                          {inspection.location_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 truncate">
                      {category ? t(`categories.${category.form_type}`, category.name) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                        inspection.status === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                        inspection.status === 'submitted' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                        inspection.status === 'draft' ? 'bg-gradient-to-r from-slate-400 to-slate-500 text-white' :
                        inspection.status === 'in_progress' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                        inspection.status === 'rejected' ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white' :
                        inspection.status === 'reassigned' ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white' :
                        inspection.status === 'under_review' ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white' :
                        'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                      }`}>
                        {getStatusText(inspection.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 truncate font-medium">
                      {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingInspection({...inspection, mode: 'view'});
                          setActiveTab('newInspection');
                        }}
                        className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                        title="View Inspection"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Recent Inspections */}
        <div className="md:hidden divide-y divide-gray-100/50">
          {getFilteredInspections().map((inspection) => {
            const category = categories.find(c => c.id === inspection.category_id);
            return (
              <div key={inspection.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-gray-900 text-sm">
                    {inspection.inspection_number}
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(inspection.status)}`}>
                    {getStatusText(inspection.status)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2 font-medium">
                  {inspection.location_name}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{category ? t(`categories.${category.form_type}`, category.name) : '-'}</span>
                  <span className="font-semibold">
                    {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderInspections = () => (
    <div className="space-y-6 md:space-y-8">
      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900 flex items-center">
            {/* <Filter className="h-7 w-7 mr-3 text-gray-700" /> */}
            <Layers className="h-7 w-7 mr-3 text-gray-700" />
            {t('fims.inspections')}
          </h3>
          <button 
            onClick={() => setActiveTab('newInspection')}
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            <span className="font-bold">{t('fims.newInspection')}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
            <input
              type="text"
              placeholder={t('fims.searchInspections')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm font-medium bg-white/80 backdrop-blur-sm"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm font-bold bg-white/80 backdrop-blur-sm"
          >
            <option value="">{t('fims.allCategories')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {t(`categories.${category.form_type}`, category.name)}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm font-bold bg-white/80 backdrop-blur-sm"
          >
            <option value="">{t('fims.allStatuses')}</option>
            <option value="planned">{t('statuses.planned','Planned')}</option>
            <option value="in_progress">{t('statuses.in_progress','In Progress')}</option>
            <option value="draft">{t('statuses.draft','Draft')}</option>
            <option value="submitted">{t('statuses.submitted','Submitted')}</option>
            <option value="approved">{t('statuses.approved','Approved')}</option>
            <option value="rejected">{t('statuses.rejected','Rejected')}</option>
            <option value="reassigned">{t('statuses.reassigned','Reassigned')}</option>
            <option value="under_review">{t('statuses.under_review','Under Review')}</option>
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-transparent">
          <h3 className="text-2xl font-black text-gray-900 flex items-center">
            {/* <Layers className="h-7 w-7 mr-3 text-gray-700" /> */}
            {/* {t('fims.inspections')} */}
          </h3>
        </div>
        
        {/* Desktop Table */}
        <div className="overflow-x-auto overflow-y-auto hidden md:block scrollbar-custom" style={{ maxHeight: '600px' }}>
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gray-50/50 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
              <tr>
                {[
                  { key: 'inspectionNumber', label: t('fims.inspectionNumber'), width: '7%' },
                  { key: 'category', label: t('fims.category'), width: '11%' },
                  { key: 'status', label: t('fims.status'), width: '7%' },
                  { key: 'date', label: t('fims.date'), width: '7%' },
                  { key: 'filled_by_name', label: t('common.filter_by_name','Filter By Name'), width: '10%' },
                  { key: 'actions', label: t('fims.actions'), width: '22%' },
                  { key: 'photos', label: t('common.photos','Photos'), width: '12%' },
                  { key: 'complete', label: t('common.complete/Revisit','Complete/Revisit'), width: '16%' }
                ].map((col, idx) => (
                  <th key={idx} className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-[${col.width}]`}>
                    <div className="flex items-center space-x-2">
                      <span>{col.label}</span>
                    </div>
                    {!['actions', 'photos', 'complete'].includes(col.key) && (
                      <input
                        type="text"
                        placeholder={t('common.filter...', 'Filter...')}
                        value={columnFilters[col.key as keyof typeof columnFilters]}
                        onChange={(e) => setColumnFilters({...columnFilters, [col.key]: e.target.value})}
                        className="mt-2 w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-900 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {getFilteredInspections().length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <FileText className="h-16 w-16 text-gray-300" />
                      <p className="text-gray-500 text-base font-semibold">{t('fims.noInspectionsFound')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                getFilteredInspections().map((inspection, index) => {
                  const category = categories.find(c => c.id === inspection.category_id);
                  return (
                    <tr 
                      key={inspection.id} 
                      className="hover:bg-gray-50/50 transition-colors backdrop-blur-sm"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 truncate">
                        {inspection.inspection_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 truncate font-medium">
                        {category ? (i18n.language === 'mr' ? category.name_marathi : category.name) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-md ${getStatusColor(inspection.status)}`}>
                          {getStatusText(inspection.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 truncate font-medium">
                        {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() :
                         inspection.planned_date ? new Date(inspection.planned_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 truncate font-medium">
                        {inspection.filled_by_name || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingInspection({...inspection, mode: 'view'});
                              setActiveTab('newInspection');
                            }}
                            className="px-3 py-2 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 flex items-center space-x-1"
                            title="View Inspection"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>{t('common.view','View')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingInspection({...inspection, mode: 'edit'});
                              setActiveTab('newInspection');
                            }}
                            className="px-3 py-2 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 flex items-center space-x-1"
                            title="Edit Inspection"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>{t('common.edit','Edit')}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteInspection(inspection.id)}
                            className="px-3 py-2 bg-gradient-to-br from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 flex items-center space-x-1"
                            title="Delete Inspection"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{t('common.delete','Delete')}</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => handleViewInspectionPhotos(inspection)}
                          className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                          title="View Photos"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCompleteInspection(inspection.id)}
                            className="px-3 py-2 text-xs font-bold bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                            title="Complete"
                          >
                            {t('common.complete','Complete')}
                          </button>
                          <button
                            onClick={() => handleRevisitInspection(inspection.id)}
                            className="px-3 py-2 text-xs font-bold bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                            title="Revisit"
                          >
                            {t('common.revisit','Revisit')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100/50">
          {getFilteredInspections().length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-base font-semibold">{t('fims.noInspectionsFound')}</p>
            </div>
          ) : (
            getFilteredInspections().map((inspection) => {
              const category = categories.find(c => c.id === inspection.category_id);
              return (
                <div key={inspection.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-gray-900 text-sm">
                      {inspection.inspection_number}
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(inspection.status)}`}>
                      {getStatusText(inspection.status)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <div className="font-semibold truncate">{inspection.location_name}</div>
                    {inspection.address && (
                      <div className="text-xs text-gray-500 mt-1 truncate" title={inspection.address}>
                        {inspection.address}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3 font-medium">
                    <span>{category ? t(`categories.${category.form_type}`, category.name) : '-'}</span>
                    <span className="font-bold">
                      {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : 
                       inspection.planned_date ? new Date(inspection.planned_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingInspection({...inspection, mode: 'view'});
                          setActiveTab('newInspection');
                        }}
                        className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingInspection({...inspection, mode: 'edit'});
                          setActiveTab('newInspection');
                        }}
                        className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewInspectionPhotos(inspection)}
                        className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                        title="Photos"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCompleteInspection(inspection.id)}
                        className="px-3 py-2 text-xs font-bold bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl transition-all duration-200 shadow-md"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleRevisitInspection(inspection.id)}
                        className="px-3 py-2 text-xs font-bold bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl transition-all duration-200 shadow-md"
                      >
                        Revisit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Mobile Header */}
      {isMobileState && renderMobileHeader()}

      {/*  Desktop Header */}
      <div className="hidden md:block bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl blur-xl opacity-30"></div>
                  <img src="/Zpchandrapurlogo.png" alt="FIMS Logo" className="relative h-[5.2rem] w-[5.2rem]  object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">FIMS</h1>
                  <p className="text-sm text-gray-600 font-semibold">{t('fims.fullName')}</p>
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="flex items-center space-x-6">
              <nav className="flex space-x-2">
                {[
                  { id: 'dashboard', icon: Home, label: t('fims.dashboard'), gradient: 'from-violet-500 to-purple-500' },
                  { id: 'inspections', icon: FileText, label: t('fims.inspections'), gradient: 'from-blue-500 to-cyan-500' },
                  { id: 'newInspection', icon: Plus, label: t('fims.newInspection'), gradient: 'from-emerald-500 to-teal-500' },
                  ...(userRole === 'developer' ? [{ id: 'analytics', icon: BarChart3, label: t('fims.analytics'), gradient: 'from-amber-500 to-orange-500' }] : [])
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-5 py-3 rounded-xl transition-all duration-300 font-bold ${
                      activeTab === item.id
                        ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg shadow-${item.gradient.split('-')[1]}-500/30`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              
              <LanguageSwitcher />
              
              {/* Desktop Profile */}
              <div className="relative z-50">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 p-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="bg-gradient-to-br from-violet-500 to-purple-500 p-2.5 rounded-xl">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-[100]">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-violet-500 to-purple-500 p-3 rounded-xl">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate">
                            {userProfile?.name || user.email?.split('@')[0]}
                          </div>
                          <div className="text-sm text-gray-600">
                            {userProfile?.role_name || 'User'}
                          </div>
                          {userProfile?.role_description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {userProfile.role_description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <button className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{t('profile.userProfile')}</span>
                      </button>
                      <button className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                        <Settings className="h-4 w-4" />
                        <span className="font-medium">{t('navigation.settings')}</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="font-bold">{t('auth.signOut')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative z-10">
        <div className="p-4 md:p-8 overflow-y-auto h-full pb-24 md:pb-8 relative z-0">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'inspections' && renderInspections()}
          {activeTab === 'newInspection' && (
            <FIMSNewInspection 
              user={user} 
              onBack={() => {
                setEditingInspection(null);
                setActiveTab('dashboard');
              }}
              categories={categories}
              onInspectionCreated={fetchInspectionsData}
              editingInspection={editingInspection}
            />
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileState && renderMobileNavigation()}

      {/* Photo Modal */}
      {showPhotoModal && viewingPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[95vh] bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-transparent">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {t('fims.inspectionPhotos', 'Inspection Photos')} ({selectedPhotoIndex + 1}/{viewingPhotos.length})
                </h3>
                {viewingPhotos[selectedPhotoIndex]?.photo_name && (
                  <p className="text-sm text-gray-600 mt-1 font-semibold">
                    {viewingPhotos[selectedPhotoIndex]?.photo_name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600 p-3 hover:bg-gray-100 rounded-xl transition-all"
                title="Close (ESC)"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative bg-gray-100">
              <img
                src={viewingPhotos[selectedPhotoIndex]?.photo_url}
                alt={viewingPhotos[selectedPhotoIndex]?.photo_name || 'Inspection photo'}
                className="w-full max-h-[calc(95vh-250px)] object-contain mx-auto"
              />

              {selectedPhotoIndex > 0 && (
                <button
                  onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-4 rounded-2xl transition-all shadow-2xl"
                  title="Previous (←)"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {selectedPhotoIndex < viewingPhotos.length - 1 && (
                <button
                  onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-4 rounded-2xl transition-all shadow-2xl"
                  title="Next (→)"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-200/50">
              {viewingPhotos[selectedPhotoIndex]?.description && (
                <p className="text-sm text-gray-700 mb-4 text-center font-semibold">
                  {viewingPhotos[selectedPhotoIndex]?.description}
                </p>
              )}

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                  disabled={selectedPhotoIndex === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>{t('fims.previous', 'Previous')}</span>
                </button>

                <div className="px-6 py-3 bg-gray-100 rounded-xl">
                  <span className="text-sm font-black text-gray-700">
                    {selectedPhotoIndex + 1} / {viewingPhotos.length}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedPhotoIndex(Math.min(viewingPhotos.length - 1, selectedPhotoIndex + 1))}
                  disabled={selectedPhotoIndex === viewingPhotos.length - 1}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-lg"
                >
                  <span>{t('fims.next', 'Next')}</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4 font-semibold">
                {t('fims.useArrowKeys', 'Use arrow keys (← →) to navigate, ESC to close')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revisit Assignment Modal */}
      {showRevisitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
              <h3 className="text-xl font-black text-gray-900 flex items-center">
                <AlertCircle className="h-6 w-6 mr-3 text-amber-600" />
                {t('fims.assignForRevisit', 'Assign for Revisit')}
              </h3>
              <button
                onClick={() => setShowRevisitModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  {t('fims.selectInspector', 'Select Inspector')}
                </label>
                <select
                  value={selectedInspector}
                  onChange={(e) => setSelectedInspector(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-semibold"
                >
                  <option value="">{t('fims.chooseInspector', 'Choose Inspector')}</option>
                  {availableInspectors.map(inspector => (
                    <option key={inspector.user_id} value={inspector.user_id}>
                      {inspector.name} ({inspector.roles?.name || 'Inspector'})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-900 font-semibold">
                      {t('fims.revisitNote', 'This inspection will be reassigned to the selected inspector for revisit. The status will be changed to "In Progress".')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200/50 bg-gray-50/50">
              <button
                onClick={() => setShowRevisitModal(false)}
                className="px-6 py-3 text-gray-700 bg-white hover:bg-gray-100 border-2 border-gray-300 rounded-xl transition-all font-bold"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmRevisit}
                disabled={isLoading || !selectedInspector}
                className="px-6 py-3 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all disabled:opacity-50 font-bold shadow-lg"
              >
                {isLoading ? t('common.saving') : t('fims.assignForRevisit', 'Assign for Revisit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        
        /* Custom Scrollbar Styles */
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.5) rgba(243, 244, 246, 0.5);
        }
        
        .scrollbar-custom::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: linear-gradient(to right, rgba(243, 244, 246, 0.5), rgba(229, 231, 235, 0.5));
          border-radius: 10px;
          margin: 4px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          border-radius: 10px;
          border: 2px solid rgba(243, 244, 246, 0.5);
          transition: all 0.3s ease;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          border-color: rgba(229, 231, 235, 0.8);
          transform: scale(1.05);
        }
        
        .scrollbar-custom::-webkit-scrollbar-corner {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        
        /* Horizontal Scrollbar */
        .scrollbar-custom::-webkit-scrollbar:horizontal {
          height: 12px;
        }
        
        /* Vertical Scrollbar */
        .scrollbar-custom::-webkit-scrollbar:vertical {
          width: 12px;
        }
      `}</style>
    </div>
  );
};
