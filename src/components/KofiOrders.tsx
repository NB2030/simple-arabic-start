import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { AlertCircle, CheckCircle, Package } from 'lucide-react';

interface KofiOrder {
  id: string;
  message_id: string;
  timestamp: string;
  type: string;
  from_name: string | null;
  amount: string;
  email: string;
  currency: string | null;
  kofi_transaction_id: string | null;
  processed: boolean | null;
  user_id: string | null;
  license_id: string | null;
  created_at: string | null;
  licenses?: {
    license_key: string;
  } | null;
}

export default function KofiOrders() {
  const [orders, setOrders] = useState<KofiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('kofi_orders')
        .select('*, licenses(license_key)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading Ko-fi orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center mx-8 mt-8">
        <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">لا توجد طلبات Ko-fi بعد</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">طلبات Ko-fi</h2>
      
      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {order.processed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <h3 className="font-semibold text-lg">{order.from_name || 'غير معروف'}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">البريد الإلكتروني:</span>
                    <p className="font-medium">{order.email}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">المبلغ:</span>
                    <p className="font-medium">{order.amount} {order.currency || 'USD'}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">النوع:</span>
                    <p className="font-medium">{order.type}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">التاريخ:</span>
                    <p className="font-medium">
                      {new Date(order.timestamp).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  
                  {order.licenses && (
                    <div className="col-span-2">
                      <span className="text-gray-500">مفتاح الترخيص:</span>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                        {order.licenses.license_key}
                      </p>
                    </div>
                  )}
                  
                  <div className="col-span-2">
                    <span className="text-gray-500">الحالة:</span>
                    <p className={`font-medium ${order.processed ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.processed ? 'تم التفعيل تلقائياً' : 'بانتظار حساب المستخدم'}
                    </p>
                    {!order.processed && (
                      <p className="text-xs text-gray-500 mt-1">
                        سيتم تفعيل الترخيص تلقائياً عندما يقوم المستخدم بإنشاء حساب بنفس البريد الإلكتروني
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}