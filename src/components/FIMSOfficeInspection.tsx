import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  FileText,
  MapPin,
  Camera,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building,
  Users,
  BookOpen,
  FolderOpen,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface FIMSOfficeInspectionProps {
  user: SupabaseUser;
  onBack: () => void;
  categories: any[];
  onInspectionCreated: () => void;
  editingInspection?: any;
}

interface OfficeInspectionFormData {
  // Section 1: कर्मचाऱ्याची माहिती
  department_name: string;
  employee_name: string;
  designation: string;
  table_number: string;
  date_of_joining: string;
  work_nature: string;
  
  // Section 2: पत्र व्यवहार तपशील
  letter_received_logged: boolean;
  letter_priority_disposed: boolean;
  weekly_report_created: boolean;
  pending_register_maintained: boolean;
  reminders_sent_in_time: boolean;
  letters_bound_with_permission: boolean;
  class_d_letters_destroyed: boolean;
  long_pending_cases: boolean;
  
  // Section 3: नोंदवह्या
  required_registers: boolean;
  updated_registers: boolean;
  registers_submitted_on_time: boolean;
  
  // Section 4: दप्तरची रचना
  file_structure_six_bundle: boolean;
  post_disposal_bundling: boolean;
  periodic_statements_submitted: boolean;
  permanent_instruction_available: boolean;
  indexed_instruction_complete: boolean;
  updated_by_gov_circular: boolean;
  files_classified: boolean;
  binding_and_submission: boolean;
  disposal_speed_satisfactory: boolean;
  
  // Section 5: तपासणीच्या तुटी
  inspection_issues_json: any[];
  
  // Section 6: कामाचा दर्जा मूल्यांकन
  evaluation_score: number;
  work_quality: string;
  
  // Section 7: अधिकारी अभिज्ञान
  inspector_name: string;
  inspector_designation: string;
  supervisor_remarks: string;
  supervisor_signature: string;
}

export const FIMSOfficeInspection: React.FC<FIMSOfficeInspectionProps> = ({
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

  // Check if we're in view mode
  const isViewMode = editingInspection?.mode === 'view';
  const isEditMode = editingInspection?.mode === 'edit';

  // Basic inspection data
  const [inspectionData, setInspectionData] = useState({
    category_id: '',
    location_name: '',
    address: '',
    planned_date: '',
    latitude: null as number | null,
    longitude: null as number | null,
    location_accuracy: null as number | null
  });

  // Office inspection form data
  const [officeFormData, setOfficeFormData] = useState<OfficeInspectionFormData>({
    department_name: '',
    employee_name: '',
    designation: '',
    table_number: '',
    date_of_joining: '',
    work_nature: '',
    letter_received_logged: false,
    letter_priority_disposed: false,
    weekly_report_created: false,
    pending_register_maintained: false,
    reminders_sent_in_time: false,
    letters_bound_with_permission: false,
    class_d_letters_destroyed: false,
    long_pending_cases: false,
    required_registers: false,
    updated_registers: false,
    registers_submitted_on_time: false,
    file_structure_six_bundle: false,
    post_disposal_bundling: false,
    periodic_statements_submitted: false,
    permanent_instruction_available: false,
    indexed_instruction_complete: false,
    updated_by_gov_circular: false,
    files_classified: false,
    binding_and_submission: false,
    disposal_speed_satisfactory: false,
    inspection_issues_json: [],
    evaluation_score: 0,
    work_quality: '',
    inspector_name: '',
    inspector_designation: '',
    supervisor_remarks: '',
    supervisor_signature: ''
  });

  // Get office inspection category
  const officeCategory = categories.find(cat => cat.form_type === 'office');

  useEffect(() => {
    if (officeCategory) {
      setInspectionData(prev => ({
        ...prev,
        category_id: officeCategory.id
      }));
    }
  }, [officeCategory]);

  // Load existing inspection data when editing
  useEffect(() => {
    if (editingInspection && editingInspection.id) {
      // Load basic inspection data
      setInspectionData({
        category_id: editingInspection.category_id || '',
        location_name: editingInspection.location_name || '',
        address: editingInspection.address || '',
        planned_date: editingInspection.planned_date ? editingInspection.planned_date.split('T')[0] : '',
        latitude: editingInspection.latitude,
        longitude: editingInspection.longitude,
        location_accuracy: editingInspection.location_accuracy
      });

      // Load office form data if it exists
      if (editingInspection.fims_office_inspection_forms && editingInspection.fims_office_inspection_forms.length > 0) {
        const formData = editingInspection.fims_office_inspection_forms[0];
        setOfficeFormData({
          department_name: formData.department_name || '',
          employee_name: formData.employee_name || '',
          designation: formData.designation || '',
          table_number: formData.table_number || '',
          date_of_joining: formData.date_of_joining || '',
          work_nature: formData.work_nature || '',
          letter_received_logged: formData.letter_received_logged || false,
          letter_priority_disposed: formData.letter_priority_disposed || false,
          weekly_report_created: formData.weekly_report_created || false,
          pending_register_maintained: formData.pending_register_maintained || false,
          reminders_sent_in_time: formData.reminders_sent_in_time || false,
          letters_bound_with_permission: formData.letters_bound_with_permission || false,
          class_d_letters_destroyed: formData.class_d_letters_destroyed || false,
          long_pending_cases: formData.long_pending_cases || false,
          required_registers: formData.required_registers || false,
          updated_registers: formData.updated_registers || false,
          registers_submitted_on_time: formData.registers_submitted_on_time || false,
          file_structure_six_bundle: formData.file_structure_six_bundle || false,
          post_disposal_bundling: formData.post_disposal_bundling || false,
          periodic_statements_submitted: formData.periodic_statements_submitted || false,
          permanent_instruction_available: formData.permanent_instruction_available || false,
          indexed_instruction_complete: formData.indexed_instruction_complete || false,
          updated_by_gov_circular: formData.updated_by_gov_circular || false,
          files_classified: formData.files_classified || false,
          binding_and_submission: formData.binding_and_submission || false,
          disposal_speed_satisfactory: formData.disposal_speed_satisfactory || false,
          inspection_issues_json: formData.inspection_issues_json || [],
          evaluation_score: formData.evaluation_score || 0,
          work_quality: formData.work_quality || '',
          inspector_name: formData.inspector_name || '',
          inspector_designation: formData.inspector_designation || '',
          supervisor_remarks: formData.supervisor_remarks || '',
          supervisor_signature: formData.supervisor_signature || ''
        });
      }
    }
  }, [editingInspection]);
  // Calculate evaluation score automatically
  useEffect(() => {
    const booleanFields = [
      'letter_received_logged', 'letter_priority_disposed', 'weekly_report_created',
      'pending_register_maintained', 'reminders_sent_in_time', 'letters_bound_with_permission',
      'class_d_letters_destroyed', 'required_registers', 'updated_registers',
      'registers_submitted_on_time', 'file_structure_six_bundle', 'post_disposal_bundling',
      'periodic_statements_submitted', 'permanent_instruction_available', 'indexed_instruction_complete',
      'updated_by_gov_circular', 'files_classified', 'binding_and_submission', 'disposal_speed_satisfactory'
    ];
    
    const score = booleanFields.reduce((count, field) => {
      return count + (officeFormData[field as keyof OfficeInspectionFormData] ? 1 : 0);
    }, 0);
    
    setOfficeFormData(prev => ({ ...prev, evaluation_score: score }));
  }, [officeFormData.letter_received_logged, officeFormData.letter_priority_disposed, 
      officeFormData.weekly_report_created, officeFormData.pending_register_maintained,
      officeFormData.reminders_sent_in_time, officeFormData.letters_bound_with_permission,
      officeFormData.class_d_letters_destroyed, officeFormData.required_registers,
      officeFormData.updated_registers, officeFormData.registers_submitted_on_time,
      officeFormData.file_structure_six_bundle, officeFormData.post_disposal_bundling,
      officeFormData.periodic_statements_submitted, officeFormData.permanent_instruction_available,
      officeFormData.indexed_instruction_complete, officeFormData.updated_by_gov_circular,
      officeFormData.files_classified, officeFormData.binding_and_submission,
      officeFormData.disposal_speed_satisfactory]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('fims.geolocationNotSupported'));
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setInspectionData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location_accuracy: position.coords.accuracy
        }));
        
        // Get location name using reverse geocoding
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`
          );
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const locationName = data.results[0].formatted_address;
            setInspectionData(prev => ({
              ...prev,
              address: locationName
            }));
          }
        } catch (error) {
          console.error('Error getting location name:', error);
        }
        
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert(t('fims.unableToGetLocation'));
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (uploadedPhotos.length + files.length > 5) {
      alert(t('fims.maxPhotosAllowed'));
      return;
    }

    setUploadedPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotosToSupabase = async (inspectionId: string) => {
    if (uploadedPhotos.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < uploadedPhotos.length; i++) {
        const file = uploadedPhotos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${inspectionId}_${Date.now()}_${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('field-visit-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('field-visit-images')
          .getPublicUrl(fileName);

        // Save photo record to database
        const { error: dbError } = await supabase
          .from('fims_inspection_photos')
          .insert({
            inspection_id: inspectionId,
            photo_url: publicUrl,
            photo_name: file.name,
            description: `Office inspection photo ${i + 1}`,
            photo_order: i + 1
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
    return `OFF-${year}${month}${day}-${time}`;
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
            address: sanitizedInspectionData.address,
            planned_date: sanitizedInspectionData.planned_date,
            inspection_date: new Date().toISOString(),
            status: isDraft ? 'draft' : 'submitted',
            form_data: officeFormData
          })
          .eq('id', editingInspection.id)
          .select()
          .single();

        if (updateError) throw updateError;
        inspectionResult = updateResult;
        
        // Upsert office inspection form record
        // const sanitizedFormData = {
        //   ...officeFormData,
        //   work_quality: officeFormData.work_quality || null
        // };

        // const { error: formError } = await supabase
        //   .from('fims_office_inspection_forms')
        //   .upsert({
        //     inspection_id: editingInspection.id,
        //     ...sanitizedFormData
        //   });

        // if (formError) throw formError;

        // Upsert office inspection form record
      const sanitizedFormData = {
        ...officeFormData,
        work_quality: officeFormData.work_quality || null
      };

      // Step 1: Check if form record already exists
      const { data: existingForm, error: checkError } = await supabase
        .from('fims_office_inspection_forms')
        .select('id')
        .eq('inspection_id', editingInspection.id)
        .maybeSingle(); // Use maybeSingle() to avoid error if not found

      if (checkError) throw checkError;

      // Step 2: Decide whether to INSERT or UPDATE based on existence
      if (existingForm) {
        // Record EXISTS - UPDATE it
        // console.log('Form record exists, updating...');
        
        const { error: updateError } = await supabase
          .from('fims_office_inspection_forms')
          .update(sanitizedFormData)
          .eq('inspection_id', editingInspection.id);

        if (updateError) throw updateError;
        // console.log('✅ Form updated successfully');
        
      } else {
        // Record DOESN'T EXIST - INSERT it
        console.log('Form record does not exist, inserting...');
        
        const { error: insertError } = await supabase
          .from('fims_office_inspection_forms')
          .insert({
            inspection_id: editingInspection.id,
            ...sanitizedFormData
          });

        if (insertError) throw insertError;
        // console.log('✅ Form inserted successfully');
      }

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
            address: sanitizedInspectionData.address,
            planned_date: sanitizedInspectionData.planned_date,
            inspection_date: new Date().toISOString(),
            status: isDraft ? 'draft' : 'submitted',
            form_data: officeFormData
          })
          .select()
          .single();

        if (createError) throw createError;
        inspectionResult = createResult;

        // Create office inspection form record
        const sanitizedFormData = {
          ...officeFormData,
          work_quality: officeFormData.work_quality || null
        };

        const { error: formError } = await supabase
          .from('fims_office_inspection_forms')
          .insert({
            inspection_id: inspectionResult.id,
            ...sanitizedFormData
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
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= step 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 mx-2 ${
              currentStep > step ? 'bg-purple-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderEmployeeInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Users className="h-5 w-5 mr-2 text-purple-600" />
        कर्मचाऱ्याची माहिती (Employee Information)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            विभागाचे नाव *
          </label>
          <input
            type="text"
            value={officeFormData.department_name}
            onChange={(e) => setOfficeFormData(prev => ({...prev, department_name: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="विभागाचे नाव प्रविष्ट करा"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            कर्मचाऱ्याचे नाव *
          </label>
          <input
            type="text"
            value={officeFormData.employee_name}
            onChange={(e) => setOfficeFormData(prev => ({...prev, employee_name: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="कर्मचाऱ्याचे नाव प्रविष्ट करा"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            पदनाम
          </label>
          <input
            type="text"
            value={officeFormData.designation}
            onChange={(e) => setOfficeFormData(prev => ({...prev, designation: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="पदनाम प्रविष्ट करा"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            टेबल क्रमांक
          </label>
          <input
            type="text"
            value={officeFormData.table_number}
            onChange={(e) => setOfficeFormData(prev => ({...prev, table_number: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="टेबल क्रमांक प्रविष्ट करा"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            कार्यरत असण्याची तारीख
          </label>
          <input
            type="date"
            value={officeFormData.date_of_joining}
            onChange={(e) => setOfficeFormData(prev => ({...prev, date_of_joining: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            हाताळलेले कामाचे स्वरूप
          </label>
          <textarea
            value={officeFormData.work_nature}
            onChange={(e) => setOfficeFormData(prev => ({...prev, work_nature: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="कामाचे स्वरूप वर्णन करा"
          />
        </div>
      </div>
    </div>
  );

  const renderLocationDetails = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          स्थान माहिती (Location Information)
        </h3>
      </div>
      
      <div className="bg-white p-6 rounded-b-lg border border-gray-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            स्थानाचे नाव *
          </label>
          <input
            type="text"
            value={inspectionData.location_name}
            onChange={(e) => setInspectionData(prev => ({...prev, location_name: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="स्थानाचे नाव प्रविष्ट करा"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              नियोजित तारीख
            </label>
            <input
              type="date"
              value={inspectionData.planned_date}
              onChange={(e) => setInspectionData(prev => ({...prev, planned_date: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GPS Location
            </label>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>{isLoading ? 'स्थान मिळवत आहे...' : 'सध्याचे स्थान मिळवा'}</span>
            </button>
          </div>
        </div>

        {inspectionData.latitude && inspectionData.longitude && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium mb-2">स्थान कॅप्चर केले</p>
            <div className="text-xs text-green-600 space-y-1">
              <p>अक्षांश: {inspectionData.latitude.toFixed(6)}</p>
              <p>रेखांश: {inspectionData.longitude.toFixed(6)}</p>
              <p>अचूकता: {inspectionData.location_accuracy ? Math.round(inspectionData.location_accuracy) + 'm' : 'N/A'}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            शोधलेले स्थान (Location Detected)
          </label>
          <textarea
            value={inspectionData.address}
            onChange={(e) => setInspectionData(prev => ({...prev, address: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="संपूर्ण पत्ता प्रविष्ट करा"
          />
        </div>
      </div>
    </div>
  );

  const renderOfficeInspectionForm = () => (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        दफ्तर निरीक्षण प्रपत्र (Office Inspection Form)
      </h3>

      {/* Section 2: पत्र व्यवहार तपशील */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-purple-600" />
          पत्र व्यवहार तपशील (Letter Correspondence Details)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'letter_received_logged', label: 'प्राप्त पत्रे कार्यविवरण पंजीत नोंदवले जातात?' },
            { key: 'letter_priority_disposed', label: 'पत्रांचा प्राधान्यानुसार निपटारा केला जातो?' },
            { key: 'weekly_report_created', label: 'आठवडी गोपवारा नियमित काढला जातो?' },
            { key: 'pending_register_maintained', label: 'प्रतिक्षाधिन तोंश्वही ठेवली आहे?' },
            { key: 'reminders_sent_in_time', label: 'विहित मुदतीत स्मरणपत्र दिले जाते?' },
            { key: 'letters_bound_with_permission', label: 'अधिकाऱ्याच्या आदेशानंतर नस्तीबद्ध केले जाते?' },
            { key: 'class_d_letters_destroyed', label: '\'ड\' वर्ग पत्र नष्ट केले जातात?' },
            { key: 'long_pending_cases', label: 'दिर्घ प्रलंबित पत्रे/प्रकरणे?' }
          ].map((field) => (
            <div key={field.key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={field.key}
                checked={officeFormData[field.key as keyof OfficeInspectionFormData] as boolean}
                onChange={(e) => setOfficeFormData(prev => ({...prev, [field.key]: e.target.checked}))}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor={field.key} className="text-sm text-gray-700">
                {field.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: नोंदवह्या */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
          नोंदवह्या (Registers)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'required_registers', label: 'आवश्यक नोंदवह्या आहेत?' },
            { key: 'updated_registers', label: 'अद्ययावत आहेत?' },
            { key: 'registers_submitted_on_time', label: 'तपासणीसाठी सादर केल्या जातात?' }
          ].map((field) => (
            <div key={field.key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={field.key}
                checked={officeFormData[field.key as keyof OfficeInspectionFormData] as boolean}
                onChange={(e) => setOfficeFormData(prev => ({...prev, [field.key]: e.target.checked}))}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor={field.key} className="text-sm text-gray-700">
                {field.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: दप्तरची रचना */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <FolderOpen className="h-5 w-5 mr-2 text-purple-600" />
          दप्तरची रचना (Office Structure)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'file_structure_six_bundle', label: '६ गठ्ठे पद्धत वापरण्यात आलेली?' },
            { key: 'post_disposal_bundling', label: 'प्राप्त पत्रांची निपटारी ६ गठ्ठ्यात केली जाते?' },
            { key: 'periodic_statements_submitted', label: 'नियतकालिक विवरण पाठवले जाते?' },
            { key: 'permanent_instruction_available', label: 'स्थायी आदेश वस्त्या उपलब्ध?' },
            { key: 'indexed_instruction_complete', label: 'पृष्ठांकन व अनुक्रमणिका पूर्ण?' },
            { key: 'updated_by_gov_circular', label: 'शासन निर्णय व परिपत्रकाने अद्ययावत?' },
            { key: 'files_classified', label: 'निंदणीकरण व वर्गीकरण?' },
            { key: 'binding_and_submission', label: 'योग्य वस्त्यात बाइंडिंग आणि पाठवणी?' },
            { key: 'disposal_speed_satisfactory', label: 'कामाचा निपटारा आवश्यक गतीने?' }
          ].map((field) => (
            <div key={field.key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={field.key}
                checked={officeFormData[field.key as keyof OfficeInspectionFormData] as boolean}
                onChange={(e) => setOfficeFormData(prev => ({...prev, [field.key]: e.target.checked}))}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor={field.key} className="text-sm text-gray-700">
                {field.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Section 6: कामाचा दर्जा मूल्यांकन */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
          कामाचा दर्जा मूल्यांकन (Work Quality Evaluation)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              होय उत्तरांची संख्या (Automatic)
            </label>
            <input
              type="number"
              value={officeFormData.evaluation_score}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              कामाचा दर्जा
            </label>
            <select
              value={officeFormData.work_quality}
              onChange={(e) => setOfficeFormData(prev => ({...prev, work_quality: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">दर्जा निवडा</option>
              <option value="वाईट">वाईट</option>
              <option value="साधारण">साधारण</option>
              <option value="चांगला">चांगला</option>
              <option value="उत्तम">उत्तम</option>
              <option value="उत्कृष्ट">उत्कृष्ट</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 7: अधिकारी अभिज्ञान */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-purple-600" />
          अधिकारी अभिज्ञान (Officer Acknowledgment)
        </h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                निरीक्षण करणाऱ्या अधिकाऱ्याचे नाव
              </label>
              <input
                type="text"
                value={officeFormData.inspector_name}
                onChange={(e) => setOfficeFormData(prev => ({...prev, inspector_name: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="अधिकाऱ्याचे नाव प्रविष्ट करा"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                पदनाम
              </label>
              <input
                type="text"
                value={officeFormData.inspector_designation}
                onChange={(e) => setOfficeFormData(prev => ({...prev, inspector_designation: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="पदनाम प्रविष्ट करा"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              कार्यालय प्रमुखाचे अभिप्राय
            </label>
            <textarea
              value={officeFormData.supervisor_remarks}
              onChange={(e) => setOfficeFormData(prev => ({...prev, supervisor_remarks: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              placeholder="कार्यालय प्रमुखाचे अभिप्राय प्रविष्ट करा"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              कार्यालय प्रमुखाची स्वाक्षरी
            </label>
            <input
              type="text"
              value={officeFormData.supervisor_signature}
              onChange={(e) => setOfficeFormData(prev => ({...prev, supervisor_signature: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="स्वाक्षरी प्रविष्ट करा"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPhotoUpload = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('fims.photoDocumentation')}
      </h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          Upload Office Photos
        </h4>
        <p className="text-gray-600 mb-4">
          Upload photos of the office for documentation and record keeping
        </p>
        
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          id="photo-upload"
        />
        <label
          htmlFor="photo-upload"
          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors duration-200"
        >
          <Camera className="h-4 w-4 mr-2" />
          {t('fims.chooseFiles')}
        </label>
        
        <p className="text-xs text-gray-500 mt-2">
          Maximum 5 photos allowed
        </p>
      </div>

      {uploadedPhotos.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            {t('fims.uploadedPhotos')} ({uploadedPhotos.length}/5)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedPhotos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Office photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {!isViewMode && (
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    ×
                  </button>
                )}
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {photo.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display existing photos when viewing */}
      {isViewMode && editingInspection?.fims_inspection_photos && editingInspection.fims_inspection_photos.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Inspection Photos ({editingInspection.fims_inspection_photos.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {editingInspection.fims_inspection_photos.map((photo: any, index: number) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.photo_url}
                  alt={photo.description || `Office photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {photo.photo_name || `Photo ${index + 1}`}
                </p>
                {photo.description && (
                  <p className="text-xs text-gray-500 truncate">
                    {photo.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show message when no photos in view mode */}
      {isViewMode && (!editingInspection?.fims_inspection_photos || editingInspection.fims_inspection_photos.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <Camera className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p>{t('fims.noPhotosFound')}</p>
        </div>
      )}

      {isUploading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600">{t('fims.uploadingPhotos')}</p>
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderEmployeeInfo();
      case 2:
        return renderLocationDetails();
      case 3:
        return renderOfficeInspectionForm();
      case 4:
        return renderPhotoUpload();
      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return officeFormData.department_name && officeFormData.employee_name;
      case 2:
        return inspectionData.location_name;
      case 3:
        return true; // Form is optional, can proceed
      case 4:
        return true; // Photos are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          {editingInspection?.mode === 'view' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-sm font-medium">
                {t('fims.viewMode')} - {t('fims.formReadOnly')}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 text-center">
              {editingInspection?.mode === 'view' ? t('fims.viewInspection') : 
               editingInspection?.mode === 'edit' ? t('fims.editInspection') : 
               t('fims.newInspection')} - दफ्तर निरीक्षण प्रपत्र
            </h1>
            <div className="w-20"></div>
          </div>

          {renderStepIndicator()}

          <div className="flex justify-center space-x-4 md:space-x-8 text-xs md:text-sm">
            <div className={`${currentStep === 1 ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
              कर्मचारी माहिती
            </div>
            <div className={`${currentStep === 2 ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
              {t('fims.locationDetails')}
            </div>
            <div className={`${currentStep === 3 ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
              दफ्तर निरीक्षण
            </div>
            <div className={`${currentStep === 4 ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
              {t('fims.photosSubmit')}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 rounded-xl shadow-lg border-2 border-blue-200 p-4 md:p-6 mb-4 md:mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm md:text-base"
          >
            {t('common.previous')}
          </button>

          <div className="flex space-x-2 md:space-x-3">
            {currentStep === 4 ? (
              <>
                {!isViewMode && (
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading || isUploading}
                  className="px-3 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2 text-sm md:text-base"
                >
                  <Save className="h-4 w-4" />
                  <span>{t('fims.saveAsDraft')}</span>
                </button>
                )}
                {!isViewMode && (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={isLoading || isUploading}
                  className="px-3 md:px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2 text-sm md:text-base"
                >
                  <Send className="h-4 w-4" />
                  <span>{isEditMode ? t('fims.updateInspection') : t('fims.submitInspection')}</span>
                </button>
                )}
              </>
            ) : (
              <button
                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                //disabled={!canProceedToNext() || isViewMode}
                disabled={!isViewMode && !canProceedToNext()}
                
                className="px-4 md:px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm md:text-base"
              >
                {t('common.next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};