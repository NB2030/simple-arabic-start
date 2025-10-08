import { useState, useEffect } from 'react';
import { supabase, License, UserLicenseWithDetails } from '../lib/supabase';
import { Key, Users, Calendar, CheckCircle, XCircle, Plus, Trash2, Search, ChevronLeft, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function AdminDashboard() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [userLicenses, setUserLicenses] = useState<UserLicenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLicense, setNewLicense] = useState({
    duration_days: 30,
    max_activations: 1,
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editingLicenseId, setEditingLicenseId] = useState<string | null>(null);
  const [editingUserLicenseId, setEditingUserLicenseId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [licensesRes, userLicensesRes] = await Promise.all([
        supabase.from('licenses').select('*').order('created_at', { ascending: false }),
        supabase
          .from('user_licenses')
          .select('*, profiles(*), licenses(*)')
          .order('activated_at', { ascending: false }),
      ]);

      if (licensesRes.data) setLicenses(licensesRes.data);
      if (userLicensesRes.data) setUserLicenses(userLicensesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 5;
    const key = [];

    for (let i = 0; i < segments; i++) {
      let segment = '';
      for (let j = 0; j < segmentLength; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      key.push(segment);
    }

    return key.join('-');
  };

  const createLicense = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const licenseKey = generateLicenseKey();

      const { error } = await supabase.from('licenses').insert({
        license_key: licenseKey,
        duration_days: newLicense.duration_days,
        max_activations: newLicense.max_activations,
        notes: newLicense.notes,
        created_by: user.id,
      });

      if (error) throw error;

      setShowCreateModal(false);
      setNewLicense({ duration_days: 30, max_activations: 1, notes: '' });
      loadData();
    } catch (error) {
      console.error('Error creating license:', error);
      alert('حدث خطأ أثناء إنشاء الترخيص');
    }
  };

  const deleteLicense = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الترخيص؟')) return;

    try {
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting license:', error);
      alert('حدث خطأ أثناء حذف الترخيص');
    }
  };

  const startEditLicense = (license: License) => {
    setEditingLicenseId(license.id);
    setEditFormData({
      duration_days: license.duration_days,
      max_activations: license.max_activations,
      notes: license.notes || '',
      is_active: license.is_active,
    });
  };

  const cancelEditLicense = () => {
    setEditingLicenseId(null);
    setEditFormData({});
  };

  const saveLicense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('licenses')
        .update({
          duration_days: editFormData.duration_days,
          max_activations: editFormData.max_activations,
          notes: editFormData.notes,
          is_active: editFormData.is_active,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم تحديث الترخيص بنجاح"
      });

      setEditingLicenseId(null);
      setEditFormData({});
      loadData();
    } catch (error) {
      console.error('Error updating license:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل تحديث الترخيص"
      });
    }
  };

  const startEditUserLicense = (userLicense: UserLicenseWithDetails) => {
    setEditingUserLicenseId(userLicense.id);
    setEditFormData({
      expires_at: new Date(userLicense.expires_at).toISOString().split('T')[0],
      is_active: userLicense.is_active,
    });
  };

  const cancelEditUserLicense = () => {
    setEditingUserLicenseId(null);
    setEditFormData({});
  };

  const saveUserLicense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_licenses')
        .update({
          expires_at: editFormData.expires_at,
          is_active: editFormData.is_active,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم تحديث ترخيص المستخدم بنجاح"
      });

      setEditingUserLicenseId(null);
      setEditFormData({});
      loadData();
    } catch (error) {
      console.error('Error updating user license:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل تحديث ترخيص المستخدم"
      });
    }
  };

  // Filter and paginate user licenses
  const filteredUserLicenses = userLicenses.filter((userLicense) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      userLicense.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      userLicense.profiles?.email?.toLowerCase().includes(searchLower) ||
      userLicense.licenses?.license_key?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredUserLicenses.length / itemsPerPage);
  const paginatedUserLicenses = filteredUserLicenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة إدارة التراخيص</h1>
          <p className="mt-2 text-gray-600">إدارة التراخيص والمستخدمين</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">إجمالي التراخيص</p>
                <p className="text-2xl font-bold text-gray-900">{licenses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">المستخدمون النشطون</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userLicenses.filter((ul) => ul.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">التراخيص النشطة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {licenses.filter((l) => l.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">التراخيص</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              إنشاء ترخيص جديد
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مفتاح الترخيص
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المدة (أيام)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التفعيلات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ملاحظات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50">
                    {editingLicenseId === license.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {license.license_key}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={editFormData.duration_days}
                            onChange={(e) => setEditFormData({ ...editFormData, duration_days: parseInt(e.target.value) })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={editFormData.max_activations}
                            onChange={(e) => setEditFormData({ ...editFormData, max_activations: parseInt(e.target.value) })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-xs text-gray-500 mr-1">/ {license.current_activations}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editFormData.is_active ? 'true' : 'false'}
                            onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === 'true' })}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="true">نشط</option>
                            <option value="false">غير نشط</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editFormData.notes}
                            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="ملاحظات..."
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveLicense(license.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="حفظ"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={cancelEditLicense}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                              title="إلغاء"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {license.license_key}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {license.duration_days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {license.current_activations} / {license.max_activations}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {license.is_active ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">نشط</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm">غير نشط</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{license.notes || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditLicense(license)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="تحرير"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteLicense(license.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="حذف"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">المستخدمون والتراخيص</h2>
              
              {/* Search Input */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث بالاسم أو البريد أو مفتاح الترخيص..."
                  className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    البريد الإلكتروني
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مفتاح الترخيص
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ التفعيل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الانتهاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUserLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد تراخيص مفعلة بعد'}
                    </td>
                  </tr>
                ) : (
                  paginatedUserLicenses.map((userLicense) => (
                    <tr key={userLicense.id} className="hover:bg-gray-50">
                      {editingUserLicenseId === userLicense.id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {userLicense.profiles?.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {userLicense.profiles?.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                              {userLicense.licenses?.license_key}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {userLicense.activated_at ? new Date(userLicense.activated_at).toLocaleDateString('ar-SA') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="date"
                              value={editFormData.expires_at}
                              onChange={(e) => setEditFormData({ ...editFormData, expires_at: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={editFormData.is_active ? 'true' : 'false'}
                              onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === 'true' })}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="true">مفعل</option>
                              <option value="false">معطل</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveUserLicense(userLicense.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="حفظ"
                              >
                                <Save className="w-5 h-5" />
                              </button>
                              <button
                                onClick={cancelEditUserLicense}
                                className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                title="إلغاء"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {userLicense.profiles?.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {userLicense.profiles?.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                              {userLicense.licenses?.license_key}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {userLicense.activated_at ? new Date(userLicense.activated_at).toLocaleDateString('ar-SA') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(userLicense.expires_at).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {userLicense.is_active &&
                            new Date(userLicense.expires_at) > new Date() ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                مفعل
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-4 h-4" />
                                منتهي
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => startEditUserLicense(userLicense)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="تحرير"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredUserLicenses.length)} من أصل {filteredUserLicenses.length}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">إنشاء ترخيص جديد</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المدة (بالأيام)
                </label>
                <input
                  type="number"
                  value={newLicense.duration_days}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, duration_days: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عدد التفعيلات المسموحة
                </label>
                <input
                  type="number"
                  value={newLicense.max_activations}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, max_activations: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={newLicense.notes}
                  onChange={(e) => setNewLicense({ ...newLicense, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createLicense}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إنشاء
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
