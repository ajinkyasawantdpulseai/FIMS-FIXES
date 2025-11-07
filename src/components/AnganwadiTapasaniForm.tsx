import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {  
  ArrowLeft,
  Plus,
  FileText,
  Camera,
  MapPin,
  Building2,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building,
  Users,
  BookOpen,
  FolderOpen,
  Search,
  Home,
  Heart,
  Scale,
  Utensils,
  Clock,
  Baby,
  Stethoscope,
  UserCheck,
  Phone,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AnganwadiTapasaniFormProps {
  user: SupabaseUser;
  onBack: () => void;
  categories: any[];
  onInspectionCreated: () => void;
  editingInspection?: any;
}

interface AnganwadiFormData {
  // Basic Information
  anganwadi_name: string;
  anganwadi_number: string;
  supervisor_name: string;
  helper_name: string;
  village_name: string;
  
  // Building and Facilities
  building_type: string;
  room_availability: boolean;
  toilet_facility: boolean;
  drinking_water: boolean;
  electricity: boolean;
  kitchen_garden: boolean;
  independent_kitchen: boolean;
  women_health_checkup_space: boolean;
  
  // Equipment and Materials
  weighing_machine: boolean;
  baby_weighing_scale: boolean;
  hammock_weighing_scale: boolean;
  adult_weighing_scale: boolean;
  height_measuring_scale: boolean;
  first_aid_kit: boolean;
  teaching_materials: boolean;
  toys_available: boolean;
  cooking_utensils: boolean;
  water_storage_containers: boolean;
  medicine_kits: boolean;
  pre_school_kit: boolean;
  
  // Records and Documentation
  attendance_register: boolean;
  growth_chart_updated: boolean;
  vaccination_records: boolean;
  nutrition_records: boolean;
  all_registers: boolean;
  monthly_progress_reports: boolean;
  
  // Schedule and Operations
  timetable_available: boolean;
  timetable_followed: boolean;
  supervisor_regular_attendance: boolean;
  
  // Children Information
  total_registered_children: number;
  children_present_today: number;
  children_0_3_years: number;
  children_3_6_years: number;
  preschool_education_registered: number;
  preschool_education_present: number;
  
  // Nutrition and Health Services
  hot_meal_served: boolean;
  take_home_ration: boolean;
  monthly_25_days_meals: boolean;
  thr_provided_regularly: boolean;
  food_provider: string;
  supervisor_participation: string;
  food_distribution_decentralized: boolean;
  children_food_taste_preference: string;
  prescribed_protein_calories: boolean;
  prescribed_weight_food: boolean;
  lab_sample_date: string;
  
  // Health Services
  health_checkup_conducted: boolean;
  immunization_updated: boolean;
  vitamin_a_given: boolean;
  iron_tablets_given: boolean;
  regular_weighing: boolean;
  growth_chart_accuracy: boolean;
  vaccination_health_checkup_regular: boolean;
  vaccination_schedule_awareness: boolean;
  
  // Community Participation
  village_health_nutrition_planning: string;
  children_attendance_comparison: string;
  preschool_programs_conducted: string;
  community_participation: string;
  committee_member_participation: string;
  home_visits_guidance: string;
  public_opinion_improvement: string;
  
  // Final Details
  general_observations: string;
  recommendations: string;
  action_required: string;
  suggestions: string;
  visit_date: string;
  inspector_designation: string;
  inspector_name: string;
}

export const AnganwadiTapasaniForm: React.FC<AnganwadiTapasaniFormProps> = ({
  user,
  onBack,
  categories,
  onInspectionCreated,
  editingInspection
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Check if we're in view mode
  const isViewMode = editingInspection?.mode === 'view';
  const isEditMode = editingInspection?.mode === 'edit';

  // Basic inspection data
  const [inspectionData, setInspectionData] = useState({
    category_id: '',
    location_name: '',
    planned_date: '',
    latitude: null as number | null,
    longitude: null as number | null,
    location_accuracy: null as number | null,
    location_detected: ''
  });

  // Anganwadi form data
  const [anganwadiFormData, setAnganwadiFormData] = useState<AnganwadiFormData>({
    anganwadi_name: '',
    anganwadi_number: '',
    supervisor_name: '',
    helper_name: '',
    village_name: '',
    building_type: '',
    room_availability: false,
    toilet_facility: false,
    drinking_water: false,
    electricity: false,
    kitchen_garden: false,
    independent_kitchen: false,
    women_health_checkup_space: false,
    weighing_machine: false,
    baby_weighing_scale: false,
    hammock_weighing_scale: false,
    adult_weighing_scale: false,
    height_measuring_scale: false,
    first_aid_kit: false,
    teaching_materials: false,
    toys_available: false,
    cooking_utensils: false,
    water_storage_containers: false,
    medicine_kits: false,
    pre_school_kit: false,
    attendance_register: false,
    growth_chart_updated: false,
    vaccination_records: false,
    nutrition_records: false,
    all_registers: false,
    monthly_progress_reports: false,
    timetable_available: false,
    timetable_followed: false,
    supervisor_regular_attendance: false,
    total_registered_children: 0,
    children_present_today: 0,
    children_0_3_years: 0,
    children_3_6_years: 0,
    preschool_education_registered: 0,
    preschool_education_present: 0,
    hot_meal_served: false,
    take_home_ration: false,
    monthly_25_days_meals: false,
    thr_provided_regularly: false,
    food_provider: '',
    supervisor_participation: '',
    food_distribution_decentralized: false,
    children_food_taste_preference: '',
    prescribed_protein_calories: false,
    prescribed_weight_food: false,
    lab_sample_date: '',
    health_checkup_conducted: false,
    immunization_updated: false,
    vitamin_a_given: false,
    iron_tablets_given: false,
    regular_weighing: false,
    growth_chart_accuracy: false,
    vaccination_health_checkup_regular: false,
    vaccination_schedule_awareness: false,
    village_health_nutrition_planning: '',
    children_attendance_comparison: '',
    preschool_programs_conducted: '',
    community_participation: '',
    committee_member_participation: '',
    home_visits_guidance: '',
    public_opinion_improvement: '',
    general_observations: '',
    recommendations: '',
    action_required: '',
    suggestions: '',
    visit_date: '',
    inspector_designation: '',
    inspector_name: ''
  });

  // Get anganwadi inspection category
  const anganwadiCategory = categories.find(cat => cat.form_type === 'anganwadi');

  useEffect(() => {
    if (anganwadiCategory) {
      setInspectionData(prev => ({
        ...prev,
        category_id: anganwadiCategory.id
      }));
    }
  }, [anganwadiCategory]);

  // Load existing inspection data when editing
  useEffect(() => {
    if (editingInspection && editingInspection.id) {
      console.log('Loading existing inspection data:', editingInspection);
      
      // Load basic inspection data
      setInspectionData({
        category_id: editingInspection.category_id || '',
        location_name: editingInspection.location_name || '',
        planned_date: editingInspection.planned_date ? editingInspection.planned_date.split('T')[0] : '',
        latitude: editingInspection.latitude,
        longitude: editingInspection.longitude,
        location_accuracy: editingInspection.location_accuracy,
        location_detected: editingInspection.location_detected || ''
      });

      // Load anganwadi form data if it exists
      let formDataToLoad = null;
      
      // Try to get data from fims_anganwadi_forms table first
      if (editingInspection.fims_anganwadi_forms && editingInspection.fims_anganwadi_forms.length > 0) {
        formDataToLoad = editingInspection.fims_anganwadi_forms[0];
        console.log('Loading from fims_anganwadi_forms:', formDataToLoad);
      } else {
        // Fallback to form_data JSON field
        formDataToLoad = editingInspection.form_data;
        console.log('Loading from form_data JSON:', formDataToLoad);
      }

      if (formDataToLoad) {
        setAnganwadiFormData({
          anganwadi_name: formDataToLoad.anganwadi_name || '',
          anganwadi_number: formDataToLoad.anganwadi_number || '',
          supervisor_name: formDataToLoad.supervisor_name || '',
          helper_name: formDataToLoad.helper_name || '',
          village_name: formDataToLoad.village_name || '',
          building_type: formDataToLoad.building_type || '',
          room_availability: formDataToLoad.room_availability || false,
          toilet_facility: formDataToLoad.toilet_facility || false,
          drinking_water: formDataToLoad.drinking_water || false,
          electricity: formDataToLoad.electricity || false,
          kitchen_garden: formDataToLoad.kitchen_garden || false,
          independent_kitchen: formDataToLoad.independent_kitchen || false,
          women_health_checkup_space: formDataToLoad.women_health_checkup_space || false,
          weighing_machine: formDataToLoad.weighing_machine || false,
          baby_weighing_scale: formDataToLoad.baby_weighing_scale || false,
          hammock_weighing_scale: formDataToLoad.hammock_weighing_scale || false,
          adult_weighing_scale: formDataToLoad.adult_weighing_scale || false,
          height_measuring_scale: formDataToLoad.height_measuring_scale || false,
          first_aid_kit: formDataToLoad.first_aid_kit || false,
          teaching_materials: formDataToLoad.teaching_materials || false,
          toys_available: formDataToLoad.toys_available || false,
          cooking_utensils: formDataToLoad.cooking_utensils || false,
          water_storage_containers: formDataToLoad.water_storage_containers || false,
          medicine_kits: formDataToLoad.medicine_kits || false,
          pre_school_kit: formDataToLoad.pre_school_kit || false,
          attendance_register: formDataToLoad.attendance_register || false,
          growth_chart_updated: formDataToLoad.growth_chart_updated || false,
          vaccination_records: formDataToLoad.vaccination_records || false,
          nutrition_records: formDataToLoad.nutrition_records || false,
          all_registers: formDataToLoad.all_registers || false,
          monthly_progress_reports: formDataToLoad.monthly_progress_reports || false,
          timetable_available: formDataToLoad.timetable_available || false,
          timetable_followed: formDataToLoad.timetable_followed || false,
          supervisor_regular_attendance: formDataToLoad.supervisor_regular_attendance || false,
          total_registered_children: formDataToLoad.total_registered_children || 0,
          children_present_today: formDataToLoad.children_present_today || 0,
          children_0_3_years: formDataToLoad.children_0_3_years || 0,
          children_3_6_years: formDataToLoad.children_3_6_years || 0,
          preschool_education_registered: formDataToLoad.preschool_education_registered || 0,
          preschool_education_present: formDataToLoad.preschool_education_present || 0,
          hot_meal_served: formDataToLoad.hot_meal_served || false,
          take_home_ration: formDataToLoad.take_home_ration || false,
          monthly_25_days_meals: formDataToLoad.monthly_25_days_meals || false,
          thr_provided_regularly: formDataToLoad.thr_provided_regularly || false,
          food_provider: formDataToLoad.food_provider || '',
          supervisor_participation: formDataToLoad.supervisor_participation || '',
          food_distribution_decentralized: formDataToLoad.food_distribution_decentralized || false,
          children_food_taste_preference: formDataToLoad.children_food_taste_preference || '',
          prescribed_protein_calories: formDataToLoad.prescribed_protein_calories || false,
          prescribed_weight_food: formDataToLoad.prescribed_weight_food || false,
          lab_sample_date: formDataToLoad.lab_sample_date || '',
          health_checkup_conducted: formDataToLoad.health_checkup_conducted || false,
          immunization_updated: formDataToLoad.immunization_updated || false,
          vitamin_a_given: formDataToLoad.vitamin_a_given || false,
          iron_tablets_given: formDataToLoad.iron_tablets_given || false,
          regular_weighing: formDataToLoad.regular_weighing || false,
          growth_chart_accuracy: formDataToLoad.growth_chart_accuracy || false,
          vaccination_health_checkup_regular: formDataToLoad.vaccination_health_checkup_regular || false,
          vaccination_schedule_awareness: formDataToLoad.vaccination_schedule_awareness || false,
          village_health_nutrition_planning: formDataToLoad.village_health_nutrition_planning || '',
          children_attendance_comparison: formDataToLoad.children_attendance_comparison || '',
          preschool_programs_conducted: formDataToLoad.preschool_programs_conducted || '',
          community_participation: formDataToLoad.community_participation || '',
          committee_member_participation: formDataToLoad.committee_member_participation || '',
          home_visits_guidance: formDataToLoad.home_visits_guidance || '',
          public_opinion_improvement: formDataToLoad.public_opinion_improvement || '',
          general_observations: formDataToLoad.general_observations || '',
          recommendations: formDataToLoad.recommendations || '',
          action_required: formDataToLoad.action_required || '',
          suggestions: formDataToLoad.suggestions || '',
          visit_date: formDataToLoad.visit_date || '',
          inspector_designation: formDataToLoad.inspector_designation || '',
          inspector_name: formDataToLoad.inspector_name || ''
        });
      }
    }
  }, [editingInspection]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('categories.geolocationNotSupported'));
      return;
    }

    // Clear any cached location data by requesting fresh location
    // This forces the browser to get a new GPS fix instead of using cached data
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        // Get location name using reverse geocoding
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`
          );
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const address = data.results[0].formatted_address;
            
            // Update all location data in a single state call
            setInspectionData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              location_accuracy: accuracy,
              location_detected: address,
              location_name: prev.location_name || address // Auto-fill if empty
            }));
          } else {
            // No geocoding results, just update coordinates
            setInspectionData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              location_accuracy: accuracy,
              location_detected: 'Location detected but address not found'
            }));
          }
        } catch (error) {
          console.error('Error getting location name:', error);
          // Fallback: just update coordinates without address
          setInspectionData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            location_accuracy: accuracy,
            location_detected: 'Unable to get address'
          }));
        }
        
        setIsGettingLocation(false);
       },
       (error) => {
         console.error('Error getting location:', error);
         setIsGettingLocation(false);
         alert(t('categories.geolocationError'));
       },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, // Increased timeout for better GPS fix
        maximumAge: 0 // Force fresh location, don't use cached data
      }
    );
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  if (uploadedPhotos.length + files.length > 5) {
    alert('Maximum 5 photos allowed');
    return;
  }
  setUploadedPhotos(prev => [...prev, ...files]);
};


  const handlePlaceSelect = (event: any) => {
    if (!event.detail) {
      console.warn('Place picker event does not contain place data');
      return;
    }
    
    const place = event.detail?.place;
    if (!place) {
      return;
    }
    
    // Handle place selection logic here
  };

  const handleFileUpload = (files: File[]) => {
    if (uploadedPhotos.length + files.length > 5) {
      alert(t('fims.maxPhotosAllowed'));
      return;
    }

    // Filter out files that are too large (>10MB) or invalid formats
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.warn(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        console.warn(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only image files under 10MB are allowed.');
    }

    if (validFiles.length > 0) {
      setUploadedPhotos(prev => [...prev, ...validFiles]);
    }
  };

const removePhoto = (index: number) => {
  setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
};


  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

const uploadPhotosToSupabase = async (inspectionId: string) => {

  if (uploadedPhotos.length === 0) return;
 
  setIsUploading(true);

  try {

    for (let i = 0; i < uploadedPhotos.length; i++) {

      const file = uploadedPhotos[i];

      const fileExt = file.name.split('.').pop();

      const fileName = `anganwadi_${inspectionId}_${Date.now()}_${i}.${fileExt}`;
 
      const { data: uploadData, error: uploadError } = await supabase.storage

        .from('field-visit-images')

        .upload(fileName, file);
 
      if (uploadError) throw uploadError;
 
      const { data: { publicUrl } } = supabase.storage

        .from('field-visit-images')

        .getPublicUrl(fileName);
 
      const { error: dbError } = await supabase

        .from('fims_inspection_photos')

        .insert({

          inspection_id: inspectionId,

          photo_url: publicUrl,

          photo_name: file.name,

          description: `Anganwadi inspection photo ${i + 1}`,

          photo_order: i + 1,

        });
 
      if (dbError) throw dbError;

    }

  } catch (error) {

    console.error('Error uploading photos:', error);

    throw error;

  } finally {

    setIsUploading(false);

  }

};

 
  const generateInspectionNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    return `AWC-${year}${month}${day}-${time}`;
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    try {
      setIsLoading(true);

      // Convert empty date strings to null for database compatibility
      const sanitizedInspectionData = {
        ...inspectionData,
        planned_date: inspectionData.planned_date || null
      };

      let inspectionResult;

      if (editingInspection && editingInspection.id) {
        // Update existing inspection
        const { data: updateResult, error: updateError } = await supabase
          .from('fims_inspections')
          .update({
            location_name: sanitizedInspectionData.location_name,
            latitude: sanitizedInspectionData.latitude,
            longitude: sanitizedInspectionData.longitude,
            location_accuracy: sanitizedInspectionData.location_accuracy,
            location_detected: sanitizedInspectionData.location_detected,
            address: sanitizedInspectionData.address,
            planned_date: sanitizedInspectionData.planned_date,
            inspection_date: new Date().toISOString(),
            status: isDraft ? 'draft' : 'submitted',
            form_data: anganwadiFormData
          })
          .eq('id', editingInspection.id)
          .select()
          .single();

        if (updateError) throw updateError;
        inspectionResult = updateResult;

        // Update anganwadi form record
        const { error: formError } = await supabase
          .from('fims_anganwadi_forms')
          .update({
            ...anganwadiFormData
          })
          .eq('inspection_id', editingInspection.id);

        if (formError) throw formError;
      } else {
        // Create new inspection
        const inspectionNumber = generateInspectionNumber();

        const { data: createResult, error: createError } = await supabase
          .from('fims_inspections')
          .insert({
            inspection_number: inspectionNumber,
            category_id: sanitizedInspectionData.category_id,
            inspector_id: user.id,
            location_name: sanitizedInspectionData.location_name,
            latitude: sanitizedInspectionData.latitude,
            longitude: sanitizedInspectionData.longitude,
            location_accuracy: sanitizedInspectionData.location_accuracy,
            location_detected: sanitizedInspectionData.location_detected,
            address: sanitizedInspectionData.address,
            planned_date: sanitizedInspectionData.planned_date,
            inspection_date: new Date().toISOString(),
            status: isDraft ? 'draft' : 'submitted',
            form_data: anganwadiFormData
          })
          .select()
          .single();

        if (createError) throw createError;
        inspectionResult = createResult;

        // Create anganwadi form record
        const { error: formError } = await supabase
          .from('fims_anganwadi_forms')
          .insert({
            inspection_id: inspectionResult.id,
            ...anganwadiFormData
          });

        if (formError) throw formError;
      }

      // Upload photos if any
      if (uploadedPhotos.length > 0) {
        await uploadPhotosToSupabase(inspectionResult.id);
      }

      const isUpdate = editingInspection && editingInspection.id;
      const message = isDraft 
        ? (isUpdate ? t('fims.inspectionUpdatedAsDraft') : t('fims.inspectionSavedAsDraft'))
        : (isUpdate ? t('fims.inspectionUpdatedSuccessfully') : t('fims.inspectionSubmittedSuccessfully'));
      
      alert(message);
      onInspectionCreated();
      onBack();

    } catch (error) {
      console.error('Error saving inspection:', error);
      alert('Error saving inspection: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= step 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 3 && (
            <div className={`w-16 h-1 mx-2 ${
              currentStep > step ? 'bg-purple-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const YesNoRadio = ({ name, value, onChange, question }: { 
    name: string; 
    value: string; 
    onChange: (value: string) => void;
    question: string;
  }) => (
    <div className="mb-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
      <p className="mb-4 text-gray-800 font-medium leading-relaxed text-lg">{question}</p>
      <div className="flex gap-8 pl-4">
        <label className="flex items-center cursor-pointer group">
          <input
            type="radio"
            name={name}
            value="होय"
            checked={value === 'होय'}
            onChange={(e) => onChange(e.target.value)}
            disabled={isViewMode}
            className="mr-3 w-5 h-5 text-green-600 border-2 border-gray-300 focus:ring-green-500 focus:ring-2 group-hover:border-green-400 transition-colors"
          />
          <span className="text-green-700 font-semibold group-hover:text-green-800 transition-colors text-lg">होय</span>
        </label>
        <label className="flex items-center cursor-pointer group">
          <input
            type="radio"
            name={name}
            value="नाही"
            checked={value === 'नाही'}
            onChange={(e) => onChange(e.target.value)}
            disabled={isViewMode}
            className="mr-3 w-5 h-5 text-red-600 border-2 border-gray-300 focus:ring-red-500 focus:ring-2 group-hover:border-red-400 transition-colors"
          />
          <span className="text-red-700 font-semibold group-hover:text-red-800 transition-colors text-lg">नाही</span>
        </label>
      </div>
    </div>
  );

  const renderBasicDetailsAndLocation = () => (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
          <div className="flex items-center text-white">
            <Building2 className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">मूलभूत माहिती (Basic Information)</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.anganwadiName')} *
              </label>
              <input
                type="text"
                value={anganwadiFormData.anganwadi_name}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, anganwadi_name: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('fims.enterAnganwadiName')}
                required
                disabled={isViewMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.anganwadiNumber')}
              </label>
              <input
                type="text"
                value={anganwadiFormData.anganwadi_number}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, anganwadi_number: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('fims.enterAnganwadiNumber')}
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.supervisorName')}
              </label>
              <input
                type="text"
                value={anganwadiFormData.supervisor_name}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, supervisor_name: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('fims.enterSupervisorName')}
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.helperName')}
              </label>
              <input
                type="text"
                value={anganwadiFormData.helper_name}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, helper_name: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('fims.enterHelperName')}
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.villageName')}
              </label>
              <input
                type="text"
                value={anganwadiFormData.village_name}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, village_name: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('fims.enterVillageName')}
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Location Information Section */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
          <div className="flex items-center text-white">
            <MapPin className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">स्थान माहिती (Location Information)</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.locationName')} *
              </label>
              <input
                type="text"
                value={inspectionData.location_name}
                onChange={(e) => setInspectionData(prev => ({...prev, location_name: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('fims.enterLocationName')}
                required
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.plannedDate')}
              </label>
              <input
                type="date"
                value={inspectionData.planned_date}
                onChange={(e) => setInspectionData(prev => ({...prev, planned_date: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPS Location
              </label>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>{isGettingLocation ? t('fims.gettingLocation') : t('fims.getCurrentLocation')}</span>
                </button>
              )}
              {inspectionData.latitude && inspectionData.longitude && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">{t('fims.locationCaptured')}</p>
                  <p className="text-xs text-green-600">
                    {t('fims.latitude')}: {inspectionData.latitude.toFixed(6)}<br />
                    {t('fims.longitude')}: {inspectionData.longitude.toFixed(6)}<br />
                    {t('fims.accuracy')}: {inspectionData.location_accuracy ? Math.round(inspectionData.location_accuracy) + 'm' : 'N/A'}
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                शोधलेले स्थान (Location Detected)
              </label>
              <input
                type="text"
                value={inspectionData.location_detected}
                onChange={(e) => setInspectionData(prev => ({...prev, location_detected: e.target.value}))}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                placeholder="GPS द्वारे शोधलेले स्थान येथे दिसेल"
                readOnly={isViewMode}
              />
            </div>
            {/* Google Maps Place Picker for manual location selection - only show if location not detected */}
            {!inspectionData.location_detected && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  स्थान शोधा (Search Location)
                </label>
                <div style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                  <gmpx-place-picker 
                    placeholder="पत्ता किंवा स्थान शोधा"
                  ></gmpx-place-picker>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );

  const renderAnganwadiInspectionForm = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 mb-10 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 px-8 py-16 text-white relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 shadow-lg">
                <FileText className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-wide">
              अंगणवाडी केंद्र तपासणी अहवाल (नमुना)
            </h1>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 inline-block shadow-lg border border-white/30">
              <p className="text-sm font-medium">
                (केंद्र शासनाचे पत्र क्र. F.No.१६-३/२००४-ME (P+) दि. २२ ऑक्टोबर२०१०.)
              </p>
              {inspectionData.location_detected && (
                <p className="text-sm text-green-700 mt-1">
                  <strong>स्थान:</strong> {inspectionData.location_detected}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1 - Facilities */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
          <div className="flex items-center text-white">
            <Home className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">१. अंगणवाडी केंद्रातील उपलब्ध सुविधा:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-8">
            <div>
              <label className="block mb-4 text-lg font-bold text-gray-700">अंगणवाडी इमारत [स्वतःची/ भाड्याची/ मोफत/ इमारत नाही]</label>
              <select
                value={anganwadiFormData.building_type}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, building_type: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                disabled={isViewMode}
              >
                <option value="">निवडा</option>
                <option value="own">स्वतःची</option>
                <option value="rented">भाड्याची</option>
                <option value="free">मोफत</option>
                <option value="no_building">इमारत नाही</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'toilet_facility', label: 'शौचालय' },
                { key: 'independent_kitchen', label: 'स्वतंत्र बंदिस्त किचन व्यवस्था' },
                { key: 'women_health_checkup_space', label: 'महिलांच्या आरोग्य तपासणीसाठी जागा' },
                { key: 'electricity', label: 'विद्युत पुरवठा' },
                { key: 'drinking_water', label: 'पिण्याचे पाणी' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center p-6 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-2xl hover:from-emerald-50 hover:to-emerald-100 transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md">
                  <input
                    type="checkbox"
                    checked={anganwadiFormData[key as keyof AnganwadiFormData] as boolean}
                    onChange={(e) => setAnganwadiFormData(prev => ({...prev, [key]: e.target.checked}))}
                    className="mr-5 w-6 h-6 text-emerald-600 border-2 border-gray-300 rounded-lg focus:ring-emerald-500 focus:ring-2 group-hover:border-emerald-400 transition-colors"
                    disabled={isViewMode}
                  />
                  <span className="text-gray-700 group-hover:text-emerald-800 font-semibold text-lg">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>
{/* Section 2 - Weighing Scales */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
          <div className="flex items-center text-white">
            <Scale className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">२. वजनकाटे उपलब्ध:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { key: 'baby_weighing_scale', label: 'बेबी वजनकाटे' },
              { key: 'hammock_weighing_scale', label: 'हॅमॉक [झोळीचे] वजनकाटे' },
              { key: 'adult_weighing_scale', label: 'प्रौढांसाठीचे वजनकाटे' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center p-6 bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl hover:from-purple-50 hover:to-purple-100 transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md">
                <input
                  type="checkbox"
                  checked={anganwadiFormData[key as keyof AnganwadiFormData] as boolean}
                  onChange={(e) => setAnganwadiFormData(prev => ({...prev, [key]: e.target.checked}))}
                  className="mr-5 w-6 h-6 text-purple-600 border-2 border-gray-300 rounded-lg focus:ring-purple-500 focus:ring-2 group-hover:border-purple-400 transition-colors"
                  disabled={isViewMode}
                />
                <span className="text-gray-700 group-hover:text-purple-800 font-semibold text-lg">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>
{/* Section 3 - Materials */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6">
          <div className="flex items-center text-white">
            <BookOpen className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">३. अंगणवाडीतील साहित्य उपलब्धता:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'cooking_utensils', label: 'स्वयंपाकाची भांडी' },
              { key: 'water_storage_containers', label: 'पिण्याचे पाणी ठेवण्यासाठी भांडी' },
              { key: 'medicine_kits', label: 'मेडिसिन किट्स' },
              { key: 'pre_school_kit', label: 'पूर्व शाले संच' },
              { key: 'all_registers', label: 'विहित नमुन्यातील रजिस्टर (सर्व)' },
              { key: 'monthly_progress_reports', label: 'छापील मासिक प्रगती अहवाल' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center p-6 bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl hover:from-orange-50 hover:to-orange-100 transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-orange-300 shadow-sm hover:shadow-md">
                <input
                  type="checkbox"
                  checked={anganwadiFormData[key as keyof AnganwadiFormData] as boolean}
                  onChange={(e) => setAnganwadiFormData(prev => ({...prev, [key]: e.target.checked}))}
                  className="mr-5 w-6 h-6 text-orange-600 border-2 border-gray-300 rounded-lg focus:ring-orange-500 focus:ring-2 group-hover:border-orange-400 transition-colors"
                  disabled={isViewMode}
                />
                <span className="text-gray-700 group-hover:text-orange-800 font-semibold text-lg">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>
{/* Section 4 - Schedule */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-8 py-6">
          <div className="flex items-center text-white">
            <Calendar className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">४. अंगणवाडी केंद्राचे वेळापत्रक:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-6">
            <YesNoRadio
              name="timetable_available"
              value={anganwadiFormData.timetable_available ? 'होय' : anganwadiFormData.timetable_available === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, timetable_available: value === 'होय'}))}
              question="१] अंगणवाडी केंद्राचे वेळापत्रक आहे काय?"
            />
            <YesNoRadio
              name="timetable_followed"
              value={anganwadiFormData.timetable_followed ? 'होय' : anganwadiFormData.timetable_followed === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, timetable_followed: value === 'होय'}))}
              question="२] नियमितपणे पाळले जाते काय?"
            />
            <YesNoRadio
              name="supervisor_regular_attendance"
              value={anganwadiFormData.supervisor_regular_attendance ? 'होय' : anganwadiFormData.supervisor_regular_attendance === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, supervisor_regular_attendance: value === 'होय'}))}
              question="३] सेविका नियमितपणे हजर राहते काय?"
            />
          </div>
        </div>
      </section>

{/* Section 5 - Food */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
          <div className="flex items-center text-white">
            <Heart className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">५. आहाराविषयी:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-6">
            <YesNoRadio
              name="monthly_25_days_meals"
              value={anganwadiFormData.monthly_25_days_meals ? 'होय' : anganwadiFormData.monthly_25_days_meals === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, monthly_25_days_meals: value === 'होय'}))}
              question="१] अंगणवाडी केंद्रात प्रत्येक महिन्याला २५ दिवस सकाळचा नाश्ता व पूरक पोषण आहार पुरविण्यात येतो काय?"
            />
            <YesNoRadio
              name="thr_provided_regularly"
              value={anganwadiFormData.thr_provided_regularly ? 'होय' : anganwadiFormData.thr_provided_regularly === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, thr_provided_regularly: value === 'होय'}))}
              question="२] ०–३ वर्षांची बालके, गर्भवती-स्तनदा माता, व तीव्र कमी वजनाच्या बालकांना THR नियमितपणे दिला जातो काय?"
            />
          </div>
        </div>
      </section>

{/* Section 6 - Self-help Groups */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-6">
          <div className="flex items-center text-white">
            <Users className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">६. स्वयंसहाय्यता बचत गटांच्या/महिला मंडळाबाबत:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-8">
            <div>
              <label className="block mb-4 text-lg font-bold text-gray-700">१] अंगणवाडीतील आहार कोणाकडून दिला जातो?</label>
              <input
                type="text"
                value={anganwadiFormData.food_provider}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, food_provider: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                disabled={isViewMode}
              />
            </div>
            <div>
              <label className="block mb-4 text-lg font-bold text-gray-700">२] यातील अंगणवाडी सेविकेच्या असलेला सहभाग.</label>
              <input
                type="text"
                value={anganwadiFormData.supervisor_participation}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, supervisor_participation: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                disabled={isViewMode}
              />
            </div>
            <YesNoRadio
              name="food_distribution_decentralized"
              value={anganwadiFormData.food_distribution_decentralized ? 'होय' : anganwadiFormData.food_distribution_decentralized === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, food_distribution_decentralized: value === 'होय'}))}
              question="३] आहार वाटपाचे काम विकेंद्रित केले आहे काय?"
            />
          </div>
        </div>
      </section>
{/* Section 7 - Children's Food Preference */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
          <div className="flex items-center text-white">
            <MapPin className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">७. मुलांना आहाराची चव व दर्जा आवडतो की कसे?:</h3>
          </div>
        </div>
        <div className="p-10">
          <div>
            <label className="block mb-4 text-lg font-bold text-gray-700">मुलांना आहार आवडतो काय?</label>
            <input
              type="text"
              value={anganwadiFormData.children_food_taste_preference}
              onChange={(e) => setAnganwadiFormData(prev => ({...prev, children_food_taste_preference: e.target.value}))}
              className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
              placeholder="मुलांच्या आहाराची आवड नमूद करा"
              disabled={isViewMode}
            />
          </div>
        </div>
      </section>
{/* Section 8 - Food Quality */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-600 px-8 py-6">
          <div className="flex items-center text-white">
            <CheckCircle className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">८. आहार दर्जा:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-6">
            <YesNoRadio
              name="prescribed_protein_calories"
              value={anganwadiFormData.prescribed_protein_calories ? 'होय' : anganwadiFormData.prescribed_protein_calories === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, prescribed_protein_calories: value === 'होय'}))}
              question="१] निर्धारीत प्रथीणे व उष्मांक असलेला आहार मिळतो काय?"
            />
            <YesNoRadio
              name="prescribed_weight_food"
              value={anganwadiFormData.prescribed_weight_food ? 'होय' : anganwadiFormData.prescribed_weight_food === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, prescribed_weight_food: value === 'होय'}))}
              question="२] निर्धारीत वजनाचा आहार मिळतो काय?"
            />
            <div>
              <label className="block mb-4 text-lg font-bold text-gray-700">३] आहार नमुने प्रयोगशाळेत पाठवले जातात काय?</label>
              <input
                type="text"
                value={anganwadiFormData.lab_sample_date}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, lab_sample_date: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>
      </section>

{/* Section 9 - Health Services */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-red-500 to-pink-600 px-8 py-6">
          <div className="flex items-center text-white">
            <Stethoscope className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">९. आरोग्य सेवा:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-6">
            <YesNoRadio
              name="regular_weighing"
              value={anganwadiFormData.regular_weighing ? 'होय' : anganwadiFormData.regular_weighing === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, regular_weighing: value === 'होय'}))}
              question="१]  बालकांचे वजने नियमित वजने घेतली जातात किंवा कसे?"
            />
            <YesNoRadio
              name="growth_chart_accuracy"
              value={anganwadiFormData.growth_chart_accuracy ? 'होय' : anganwadiFormData.growth_chart_accuracy === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, growth_chart_accuracy: value === 'होय'}))}
              question="२] (वृद्धिपत्रक तपासून) वय व वजन यांची नोंद तपासून पोषण श्रेणी योग्य प्रमाणे दर्शविलेली आहे काय? काही मुलांची प्रत्यक्ष वजने घेऊन तपासणी व खात्री करावी. तसेच वृद्धिपत्रकातील नोंद तपासावी."
            />
            <YesNoRadio
              name="vaccination_health_checkup_regular"
              value={anganwadiFormData.vaccination_health_checkup_regular ? 'होय' : anganwadiFormData.vaccination_health_checkup_regular === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, vaccination_health_checkup_regular: value === 'होय'}))}
              question="३] लसीकरण व आरोग्य तपासणी नियमितपणे होते काय? (मागील दोन महिन्याचे रेकॉर्ड तपासावे.)"
            />
            <YesNoRadio
              name="vaccination_schedule_awareness"
              value={anganwadiFormData.vaccination_schedule_awareness ? 'होय' : anganwadiFormData.vaccination_schedule_awareness === false ? 'नाही' : ''}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, vaccination_schedule_awareness: value === 'होय'}))}
              question="४] लसीकरण दिवसाची माहिती लाभार्थी पालकांना आहे काय? (एक-दोन घरी जाऊन तपासावे)"
            />
          </div>
        </div>
      </section>

{/* Section 10 - Community Participation */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-6">
          <div className="flex items-center text-white">
            <UserCheck className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">१०. समुदायिक सहभाग:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-8">
            <div>
              <label className="block mb-4 text-lg font-bold text-gray-700">१] गावातील आरोग्य व पोषण नियोजनात सहभाग</label>
              <input
                type="text"
                value={anganwadiFormData.village_health_nutrition_planning}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, village_health_nutrition_planning: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                disabled={isViewMode}
              />
            </div>
            <div>
              <label className="block mb-4 text-lg font-bold text-gray-700">२] मुलांच्या उपस्थितीची तुलना</label>
              <input
                type="text"
                value={anganwadiFormData.children_attendance_comparison}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, children_attendance_comparison: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>
      </section>

{/* Additional Sections */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
          <div className="flex items-center text-white">
            <Users className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">अतिरिक्त तपशील:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-8">
            <div>
              <YesNoRadio
                name="village_health_nutrition_micro_planning"
                value={anganwadiFormData.village_health_nutrition_micro_planning}
                onChange={(value) => setAnganwadiFormData(prev => ({...prev, village_health_nutrition_micro_planning: value}))}
                question="११. ग्राम आरोग्य व पोषण दिवसाचे गावनिहाय सूक्ष्म नियोजन केले आहे काय?"
              />
            </div>
        
            <div>
              <h4 className="font-semibold mb-4 text-lg text-gray-700">१२. भेटीच्या दिवशी प्रत्यक्ष उपस्थित असलेली बालके व नोंदविलेल्या बालकांपैकी त्या दिवशी प्रत्यक्ष हजर असलेली बालके. (मागील आठवड्यातील सरासरी आकडेवारीची ही संख्या पडताळून पहावी.):</h4>
              <input
                type="text"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                disabled={isViewMode}
              />
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg text-gray-700">१३. पूर्व शालेय शिक्षण:</h4>
              <div className="space-y-4 pl-6">
                <div>
                  <label className="block mb-2 font-medium">१] पूर्वशालेय शिक्षणासाठी नोंदवलेली बालके</label>
                  <input
                    type="number"
                    value={anganwadiFormData.preschool_education_registered}
                    onChange={(e) => setAnganwadiFormData(prev => ({...prev, preschool_education_registered: parseInt(e.target.value) || 0}))}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">२] भेटीची वेळी प्रत्यक्ष हजर बालके</label>
                  <input
                    type="number"
                    value={anganwadiFormData.preschool_education_present}
                    onChange={(e) => setAnganwadiFormData(prev => ({...prev, preschool_education_present: parseInt(e.target.value) || 0}))}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">३] भेटीचे दिवशी कोणकोणते कार्यक्रम घेतले</label>
                  <input
                    type="text"
                    value={anganwadiFormData.preschool_programs_conducted}
                    onChange={(e) => setAnganwadiFormData(prev => ({...prev, preschool_programs_conducted: e.target.value}))}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
                <div className="flex items-center text-white">
                  <Users className="w-8 h-8 mr-4" />
                  <h3 className="text-2xl font-bold">१४. लोकसहभाग:</h3>
                </div>
              </div>
              <div className="p-10">
                <div className="space-y-8">
                  <div>
                    <YesNoRadio
                      name="village_health_nutrition_micro_planning"
                      value={anganwadiFormData.village_health_nutrition_micro_planning}
                      onChange={(value) => setAnganwadiFormData(prev => ({...prev, village_health_nutrition_micro_planning: value}))}
                      question="१] अंगणवाडी केंद्राला गावातील लोकांचे सहकार्य मिळते काय? मिळत नसेल तर का?(याबाबत ग्राम समिती अथवा ग्राम पंचायत सदस्य यांचेशी चर्चा करावी.)"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium">२] यामध्ये ग्राम समिती सदस्य/ ग्राम पंचायत सदस्य/ आरोग्य सेविका/ इतर उपस्थिती कशी होती?</label>
                    <textarea
                      value={anganwadiFormData.committee_member_participation}
                      onChange={(e) => setAnganwadiFormData(prev => ({...prev, committee_member_participation: e.target.value}))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg"
                      rows={3}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
            </section>

            <YesNoRadio
              name="home_visits_guidance"
              value={anganwadiFormData.home_visits_guidance}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, home_visits_guidance: value}))}
              question="१५. गरोदर महिला, आजारी असलेली बालके यांचे घरी अंगणवाडी सेविका नियमित भेट देऊन त्यांना मार्गदर्शन व सल्ला देण्याचे काम करते किंवा कसे? (काही घरी भेट देऊन याबाबत पडताळणी करावी.)"
            />

            <YesNoRadio
              name="public_opinion_improvement"
              value={anganwadiFormData.public_opinion_improvement}
              onChange={(value) => setAnganwadiFormData(prev => ({...prev, public_opinion_improvement: value}))}
              question="१६. अंगणवाडी क्षेत्रातील लोकांचे अंगणवाडीचे कामकाजाबाबत सर्वसाधारण मत कसे आहे? तसेच मागील २–३ वर्षाचे कालावधीत काही सुधारणा झालेल्या आहेत काय?"
            />

            

            <div>
              <h4 className="font-semibold mb-4 text-lg text-gray-700">१७. काही सूचना असल्यास-</h4>
              <textarea
                value={anganwadiFormData.suggestions}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, suggestions: e.target.value}))}
                className="w-full p-3 border-2 border-gray-200 rounded-lg"
                rows={3}
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>
      </section>


{/* Final Section - Inspector Details */}
      <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-gradient-to-r from-gray-600 to-gray-800 px-8 py-6">
          <div className="flex items-center text-white">
            <FileText className="w-8 h-8 mr-4" />
            <h3 className="text-2xl font-bold">तपासणी अधिकारी माहिती:</h3>
          </div>
        </div>
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-4 text-lg font-bold text-gray-700">भेटीची तारीख</label>
              <input
  type="date"
  value={anganwadiFormData.visit_date}
  onChange={(e) =>
    setAnganwadiFormData((prev) => ({ ...prev, visit_date: e.target.value }))
  }
  className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
  disabled={isViewMode}
/>

            </div>
            <div>
              <label className="block mb-4 text-lg font-bold text-gray-700">तपासणी अधिकारीचे नाव</label>
              <input
                type="text"
                value={anganwadiFormData.inspector_name}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, inspector_name: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                disabled={isViewMode}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-4 text-lg font-bold text-gray-700">तपासणी अधिकारीचे पदनाम</label>
              <input
                type="text"
                value={anganwadiFormData.inspector_designation}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, inspector_designation: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                disabled={isViewMode}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-4 text-lg font-bold text-gray-700">सामान्य निरीक्षणे</label>
              <textarea
                value={anganwadiFormData.general_observations}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, general_observations: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                rows={3}
                disabled={isViewMode}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-4 text-lg font-bold text-gray-700">शिफारसी</label>
              <textarea
                value={anganwadiFormData.recommendations}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, recommendations: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                rows={3}
                disabled={isViewMode}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-4 text-lg font-bold text-gray-700">सूचना</label>
              <textarea
                value={anganwadiFormData.suggestions}
                onChange={(e) => setAnganwadiFormData(prev => ({...prev, suggestions: e.target.value}))}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-300 bg-gray-50 hover:bg-white text-lg shadow-sm"
                rows={3}
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );

const renderPhotosAndSubmit = () => (
  <div className="space-y-8">

    {/* Photo Upload Section */}
    <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
        <div className="flex items-center text-white">
          <Camera className="w-8 h-8 mr-4" />
          <h3 className="text-2xl font-bold">फोटो अपलोड करा</h3>
        </div>
      </div>

      <div className="p-10">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            फोटो दस्तऐवजीकरण
          </h3>

          {/* Photo Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors duration-200">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">अंगणवाडी फोटो अपलोड करा</h4>
            <p className="text-gray-600 mb-4">
              {uploadedPhotos.length > 0
                ? `${uploadedPhotos.length}/5 फोटो निवडले आहेत`
                : 'फोटो निवडा (जास्तीत जास्त 5)'}
            </p>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isViewMode || uploadedPhotos.length >= 5}
              id="photo-upload"
              style={{ display: 'none' }}
            />

            <label
              htmlFor="photo-upload"
              className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                isViewMode || uploadedPhotos.length >= 5
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <Camera className="h-4 w-4 mr-2" />
              {uploadedPhotos.length >= 5 ? 'जास्तीत जास्त फोटो पोहोचले' : 'फोटो निवडा'}
            </label>
          </div>

          {/* Photo Previews */}
          {uploadedPhotos.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2 text-purple-600" />
                निवडलेले फोटो ({uploadedPhotos.length}/5)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedPhotos.map((file, index) => (
                  <div
                    key={index}
                    className="relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-200"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />

                    {!isViewMode && (
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-colors duration-200"
                      >
                        <span className="text-sm font-bold">×</span>
                      </button>
                    )}

                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-800 truncate mb-1">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">फोटो अपलोड करत आहे...</span>
                <span className="text-sm text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Display existing photos when viewing */}
          {isViewMode &&
            editingInspection?.fims_inspection_photos &&
            editingInspection.fims_inspection_photos.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  तपासणी फोटो ({editingInspection.fims_inspection_photos.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {editingInspection.fims_inspection_photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.description || `Anganwadi photo ${index + 1}`}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-800 truncate mb-1">
                          {photo.photo_name || `Photo ${index + 1}`}
                        </p>
                        {photo.description && (
                          <p className="text-xs text-gray-500 truncate">{photo.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* No photos message for view mode */}
          {isViewMode &&
            (!editingInspection?.fims_inspection_photos ||
              editingInspection.fims_inspection_photos.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Camera className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>कोणतेही फोटो सापडले नाहीत</p>
              </div>
            )}
        </div>
      </div>
    </section>

    {/* Submit Buttons */}
    {!isViewMode && (
      <div className="flex justify-center space-x-4">
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isLoading || isUploading}
          className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          <span>{isLoading ? 'सेव्ह करत आहे...' : 'मसुदा म्हणून जतन करा'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isLoading || isUploading}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
          <span>{isLoading ? 'सबमिट करत आहे...' : 'तपासणी सबमिट करा'}</span>
        </button>
      </div>
    )}
  </div>
);


 
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t('common.back')}</span>
        </button>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Form Content */}
      {currentStep === 1 && renderBasicDetailsAndLocation()}
      {currentStep === 2 && renderAnganwadiInspectionForm()}
      {currentStep === 3 && renderPhotosAndSubmit()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
        >
          {t('common.previous')}
        </button>
        
        {currentStep < 3 && (
          <button
            onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('common.next')}
          </button>
        )}
      </div>
    </div>
  );
};
