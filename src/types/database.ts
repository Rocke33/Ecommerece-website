export interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
}

export interface OrderItem {
  quantity: number;
  price_at_purchase: number;
  products: Pick<Product, 'title' | 'image_url'> | null;
}

export interface UserOrder {
  id: number;
  total_amount: number;
  status: 'Pending Delivery' | 'Shipped' | string;
  shipping_address: string;
  created_at: string;
  order_items: OrderItem[];
}

export interface CartItem {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  created_at?: string;
}