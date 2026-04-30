import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Package, Truck, CheckCircle2, XCircle, Clock, MapPin, Phone, Mail, User } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    productTitle: string;
    price: number;
    quantity: number;
    seller?: {
      name: string;
      email: string;
      phone: string;
      campus: string;
    };
  }>;
  total: number;
  deliveryAddress: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950', iconColor: 'text-yellow-600' },
  processing: { icon: Package, label: 'Processing', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950', iconColor: 'text-blue-600' },
  shipped: { icon: Truck, label: 'Shipped', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950', iconColor: 'text-purple-600' },
  delivered: { icon: CheckCircle2, label: 'Delivered', color: 'text-green-600 bg-green-50 dark:bg-green-950', iconColor: 'text-green-600' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-600 bg-red-50 dark:bg-red-950', iconColor: 'text-red-600' },
};

const OrdersPage = () => {
  const { user } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadOrders();
  }, [user, navigate, searchParams]);

  const loadOrders = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/orders?user_id=${user.id}`);
      if (response.ok) {
        const dbOrders = await response.json();
        
        if (Array.isArray(dbOrders)) {
          // Transform database orders to match frontend format
          const transformedOrders: Order[] = dbOrders.map((order: any) => ({
            id: order.id,
            orderNumber: `CM${order.id.slice(-8)}`,
            customer: {
              name: user.name,
              email: user.email,
              phone: order.delivery_phone,
            },
            items: order.items || [],
            total: order.total_amount,
            deliveryAddress: order.delivery_address,
            status: order.status,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
          }));

          // Sort by date (newest first)
          transformedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(transformedOrders);

          // Check if there's an order parameter in URL
          const orderId = searchParams.get('order');
          if (orderId) {
            const order = transformedOrders.find(o => o.id === orderId);
            if (order) setSelectedOrder(order);
          }
        } else {
          throw new Error('API returned invalid data format');
        }
      } else {
        throw new Error('Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      
      // Fallback to localStorage
      const savedOrders = JSON.parse(localStorage.getItem('campusmart_orders') || '[]');
      const userOrders = savedOrders.filter((order: Order) => order.customer.email === user.email);
      userOrders.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(userOrders);

      // Check if there's an order parameter in URL
      const orderId = searchParams.get('order');
      if (orderId) {
        const order = userOrders.find((o: Order) => o.id === orderId);
        if (order) setSelectedOrder(order);
      }
    }
  };

  if (!user) {
    return null;
  }

  if (selectedOrder) {
    const config = statusConfig[selectedOrder.status];
    const StatusIcon = config.icon;

    return (
      <PageShell title="Order Details">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedOrder(null)}
            className="mb-4 text-sm text-accent hover:underline"
          >
            ← Back to all orders
          </button>

          {/* Order Header */}
          <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-foreground">Order #{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${config.color} flex items-center gap-2`}>
                <StatusIcon className={`h-4 w-4 ${config.iconColor}`} />
                {config.label}
              </span>
            </div>

            {/* Order Timeline */}
            <div className="mt-6 relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
              <div className="space-y-6">
                {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                  const stepConfig = statusConfig[status as keyof typeof statusConfig];
                  const StepIcon = stepConfig.icon;
                  const isCompleted = ['pending', 'processing', 'shipped', 'delivered'].indexOf(selectedOrder.status) >= index;
                  const isCurrent = selectedOrder.status === status;
                  
                  return (
                    <div key={status} className="relative flex items-start gap-4">
                      <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                        isCompleted ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`text-sm font-bold ${isCurrent ? 'text-accent' : 'text-foreground'}`}>
                          {stepConfig.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Updated {new Date(selectedOrder.updatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
            <h3 className="text-lg font-extrabold mb-4">Order Items</h3>
            <div className="space-y-4">
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{item.productTitle}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quantity: {item.quantity} × KES {item.price.toLocaleString()}
                    </p>
                    {item.seller && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground">Seller: {item.seller.name}</p>
                        <p>📱 {item.seller.phone}</p>
                        <p>📍 {item.seller.campus}</p>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-accent">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">KES {(selectedOrder.total - 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold">KES 100</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold">
                <span>Total</span>
                <span className="text-accent">KES {selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-card rounded-2xl p-6 shadow-card">
            <h3 className="text-lg font-extrabold mb-4">Delivery Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.deliveryAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Customer</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Phone</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="My Orders">
      {orders.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center shadow-card">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You haven't placed any orders yet.</p>
          <Link to="/" className="mt-4 inline-block rounded-full gradient-accent px-5 py-2 text-sm font-bold text-accent-foreground shadow-accent">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;
            
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-card rounded-xl p-4 shadow-card hover:shadow-elevated transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">Order #{order.orderNumber}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color} flex items-center gap-1.5`}>
                    <StatusIcon className={`h-3 w-3 ${config.iconColor}`} />
                    {config.label}
                  </span>
                </div>
                
                <div className="space-y-1 mb-3">
                  {order.items.slice(0, 2).map((item, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      {item.productTitle} × {item.quantity}
                    </p>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-extrabold text-accent">
                    KES {order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default OrdersPage;
