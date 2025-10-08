import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Key, Calendar, RefreshCw, Trash2, Edit, Search } from 'lucide-react';
import EditUserModal from './EditUserModal';
import { useToast } from '../hooks/use-toast';

export default function AdminDashboard() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [userLicenses, setUserLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [refreshingLicenses, setRefreshingLicenses] = useState(false);
  const [refreshingUserLicenses, setRefreshingUserLicenses] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check cache first
    const cacheKey = 'admin_dashboard_cache';
    const cachedData = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(cacheKey + '_time');
    
    if (cachedData && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 5 * 60 * 1000) {
        const { licenses: cachedLicenses, userLicenses: cachedUserLicenses } = JSON.parse(cachedData);
        setLicenses(cachedLicenses);
        setUserLicenses(cachedUserLicenses);
        setLoading(false);
        return;
      }
    }
    
    loadData();
  }, [sortOrder]);

  const loadData = async () => {
    try {
      const { data: licensesData, error: licensesError } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'newest' ? false : true })
        .limit(50);

      if (licensesError) throw licensesError;

      const { data: userLicensesData, error: userLicensesError } = await supabase
        .from('user_licenses')
        .select('*, profiles(*), licenses(*)')
        .order('activated_at', { ascending: false })
        .limit(50);

      if (userLicensesError) throw userLicensesError;

      setLicenses(licensesData || []);
      setUserLicenses(userLicensesData || []);

      // Cache the data
      const cacheData = { licenses: licensesData, userLicenses: userLicensesData };
      sessionStorage.setItem('admin_dashboard_cache', JSON.stringify(cacheData));
      sessionStorage.setItem('admin_dashboard_cache_time', Date.now().toString());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshLicenses = async () => {
    setRefreshingLicenses(true);
    try {
      const lastCreatedAt = licenses.length > 0 ? licenses[0].created_at : null;
      
      let query = supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (lastCreatedAt) {
        query = query.gt('created_at', lastCreatedAt);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const updatedLicenses = [...data, ...licenses].slice(0, 50);
        setLicenses(updatedLicenses);
        
        const cacheData = { licenses: updatedLicenses, userLicenses };
        sessionStorage.setItem('admin_dashboard_cache', JSON.stringify(cacheData));
        sessionStorage.setItem('admin_dashboard_cache_time', Date.now().toString());
        
        toast({
          title: "تم التحديث",
          description: `تم إضافة ${data.length} ترخيص جديد`
        });
      } else {
        toast({
          title: "لا يوجد جديد",
          description: "لا توجد تراخيص جديدة"
        });
      }
    } catch (error) {
      console.error('Error refreshing licenses:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل تحديث التراخيص"
      });
    } finally {
      setRefreshingLicenses(false);
    }
  };

  const refreshUserLicenses = async () => {
    setRefreshingUserLicenses(true);
    try {
      const lastActivatedAt = userLicenses.length > 0 ? userLicenses[0].activated_at : null;
      
      let query = supabase
        .from('user_licenses')
        .select('*, profiles(*), licenses(*)')
        .order('activated_at', { ascending: false });
      
      if (lastActivatedAt) {
        query = query.gt('activated_at', lastActivatedAt);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const updatedUserLicenses = [...data, ...userLicenses].slice(0, 50);
        setUserLicenses(updatedUserLicenses);
        
        const cacheData = { licenses, userLicenses: updatedUserLicenses };
        sessionStorage.setItem('admin_dashboard_cache', JSON.stringify(cacheData));
        sessionStorage.setItem('admin_dashboard_cache_time', Date.now().toString());
        
        toast({
          title: "تم التحديث",
          description: `تم إضافة ${data.length} ترخيص مستخدم جديد`
        });
      } else {
        toast({
          title: "لا يوجد جديد",
          description: "لا توجد تراخيص مستخدمين جديدة"
        });
      }
    } catch (error) {
      console.error('Error refreshing user licenses:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل تحديث تراخيص المستخدمين"
      });
    } finally {
      setRefreshingUserLicenses(false);
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الترخيص؟')) return;

    try {
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (error) throw error;
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الترخيص بنجاح'
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEditLicense = () => {
    toast({
      title: 'قريباً',
      description: 'ميزة التعديل قيد التطوير'
    });
  };

  const handleEditUser = (userId: string) => {
    setEditingUserId(userId);
    setShowEditUserModal(true);
  };

  const filteredLicenses = licenses.filter(license =>
    license.license_key.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Stats */}
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
                <User className="w-6 h-6 text-green-600" />
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

        {/* Licenses Table */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">التراخيص</h3>
              <div className="flex gap-2">
                <button
                  onClick={refreshLicenses}
                  disabled={refreshingLicenses}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingLicenses ? 'animate-spin' : ''}`} />
                  تحديث
                </button>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن ترخيص..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'newest' | 'oldest');
                  loadData();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    مفتاح الترخيص
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    المدة (أيام)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    التفعيلات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    ملاحظات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? 'لا توجد نتائج بحث' : 'لا توجد تراخيص'}
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((license) => (
                    <tr key={license.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {license.license_key}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {license.duration_days}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            license.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {license.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {license.current_activations} / {license.max_activations}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {license.created_at ? new Date(license.created_at).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {license.notes || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleEditLicense}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLicense(license.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Licenses Table */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">المستخدمون والتراخيص</h3>
            <button
              onClick={refreshUserLicenses}
              disabled={refreshingUserLicenses}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingUserLicenses ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    البريد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    مفتاح الترخيص
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    تاريخ الانتهاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      لا توجد تراخيص مستخدمين
                    </td>
                  </tr>
                ) : (
                  userLicenses.map((ul) => (
                    <tr key={ul.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <button
                          onClick={() => handleEditUser(ul.user_id)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {ul.profiles?.full_name || 'غير معروف'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ul.profiles?.email || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {ul.licenses?.license_key || '-'}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ul.expires_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ul.is_active && new Date(ul.expires_at) > new Date()
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ul.is_active && new Date(ul.expires_at) > new Date() ? 'نشط' : 'منتهي'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showEditUserModal && editingUserId && (
        <EditUserModal
          userId={editingUserId}
          onClose={() => {
            setShowEditUserModal(false);
            setEditingUserId(null);
          }}
          onUpdate={() => {
            loadData();
            setShowEditUserModal(false);
            setEditingUserId(null);
          }}
        />
      )}
    </div>
  );
}
