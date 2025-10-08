import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, Mail, User, Key, Calendar, Shield, Link2, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { emailSchema, fullNameSchema, passwordSchema } from '../lib/validation';
import { z } from 'zod';

interface UserLicenseDetails {
  id: string;
  user_id: string;
  license_id: string;
  activated_at: string | null;
  expires_at: string;
  is_active: boolean | null;
  licenses?: {
    license_key: string;
    duration_days: number;
  };
}

interface EditUserModalProps {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditUserModal({ userId, onClose, onUpdate }: EditUserModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userLicenses, setUserLicenses] = useState<UserLicenseDetails[]>([]);
  const [availableLicenses, setAvailableLicenses] = useState<any[]>([]);
  const [selectedLicenseId, setSelectedLicenseId] = useState('');

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setEmail(profile.email);
      setFullName(profile.full_name);

      // Load user licenses
      const { data: licenses, error: licensesError } = await supabase
        .from('user_licenses')
        .select('*, licenses(*)')
        .eq('user_id', userId);

      if (licensesError) throw licensesError;
      setUserLicenses(licenses || []);

      // Load available licenses (not yet activated)
      const { data: allLicenses, error: allLicensesError } = await supabase
        .from('licenses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (allLicensesError) throw allLicensesError;
      setAvailableLicenses(allLicenses || []);

    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل بيانات المستخدم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate email
      emailSchema.parse(email);
      // Validate full name
      fullNameSchema.parse(fullName);
      
      // Validate password if provided
      if (newPassword) {
        passwordSchema.parse(newPassword);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'خطأ في التحقق',
          description: err.issues[0].message,
          variant: 'destructive'
        });
        return;
      }
    }

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: email.toLowerCase(),
          full_name: fullName
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update auth email if changed
      const { error: authEmailError } = await supabase.auth.admin.updateUserById(
        userId,
        { email: email.toLowerCase() }
      );

      if (authEmailError) console.error('Auth email update error:', authEmailError);

      // Update password if provided
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (passwordError) throw passwordError;
      }

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات المستخدم بنجاح'
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حفظ التغييرات',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLicense = async (licenseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_licenses')
        .update({ is_active: !currentStatus })
        .eq('id', licenseId);

      if (error) throw error;

      toast({
        title: currentStatus ? 'تم التعطيل' : 'تم التفعيل',
        description: 'تم تحديث حالة الترخيص'
      });

      loadUserData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleAddLicense = async () => {
    if (!selectedLicenseId) {
      toast({
        title: 'تنبيه',
        description: 'الرجاء اختيار ترخيص',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get license duration
      const license = availableLicenses.find(l => l.id === selectedLicenseId);
      if (!license) throw new Error('الترخيص غير موجود');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + license.duration_days);

      // Add license to user
      const { error: insertError } = await supabase
        .from('user_licenses')
        .insert({
          user_id: userId,
          license_id: selectedLicenseId,
          expires_at: expiresAt.toISOString(),
          is_active: true
        });

      if (insertError) throw insertError;

      // Update license activation count
      const { error: updateError } = await supabase
        .from('licenses')
        .update({
          current_activations: license.current_activations + 1
        })
        .eq('id', selectedLicenseId);

      if (updateError) console.error('Activation count update error:', updateError);

      toast({
        title: 'تم الإضافة',
        description: 'تم ربط الترخيص بالمستخدم بنجاح'
      });

      setSelectedLicenseId('');
      loadUserData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRemoveLicense = async (userLicenseId: string, licenseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الترخيص؟')) return;

    try {
      // Remove user license
      const { error: deleteError } = await supabase
        .from('user_licenses')
        .delete()
        .eq('id', userLicenseId);

      if (deleteError) throw deleteError;

      // Decrease activation count
      const license = availableLicenses.find(l => l.id === licenseId);
      if (license && license.current_activations > 0) {
        await supabase
          .from('licenses')
          .update({
            current_activations: license.current_activations - 1
          })
          .eq('id', licenseId);
      }

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الترخيص من المستخدم'
      });

      loadUserData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">تفاصيل المستخدم</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              المعلومات الأساسية
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline ml-1" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline ml-1" />
                الاسم الكامل
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="w-4 h-4 inline ml-1" />
                كلمة المرور الجديدة (اختياري)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="اتركه فارغاً إذا لم ترد التغيير"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم
              </p>
            </div>
          </div>

          {/* Licenses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              التراخيص المرتبطة
            </h3>

            <div className="space-y-2">
              {userLicenses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">لا توجد تراخيص مرتبطة</p>
              ) : (
                userLicenses.map((ul) => (
                  <div
                    key={ul.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                        {ul.licenses?.license_key}
                      </code>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          ينتهي: {new Date(ul.expires_at).toLocaleDateString('ar-SA')}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          ul.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {ul.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleLicense(ul.id, ul.is_active || false)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          ul.is_active
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {ul.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button
                        onClick={() => handleRemoveLicense(ul.id, ul.license_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add License */}
            <div className="flex gap-2">
              <select
                value={selectedLicenseId}
                onChange={(e) => setSelectedLicenseId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">اختر ترخيص للإضافة...</option>
                {availableLicenses
                  .filter(l => l.current_activations < l.max_activations)
                  .map((license) => (
                    <option key={license.id} value={license.id}>
                      {license.license_key} - {license.duration_days} يوم
                    </option>
                  ))}
              </select>
              <button
                onClick={handleAddLicense}
                disabled={!selectedLicenseId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Link2 className="w-5 h-5" />
                إضافة
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ التغييرات
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
