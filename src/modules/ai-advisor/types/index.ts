export interface RevenueStats {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  completed_orders: number;
  cancelled_orders: number;
  period: string;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  category_name: string;
  total_quantity: number;
  total_revenue: number;
  rank: number;
}

export interface CategoryBreakdown {
  category_name: string;
  total_revenue: number;
  total_quantity: number;
  order_count: number;
  revenue_share_percent: number;
}

export interface ShiftPerformance {
  shift_name: string;
  start_time: string;
  end_time: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface InventoryAlert {
  ingredient_name: string;
  unit: string;
  actual_quantity: number;
  minimum_threshold: number;
  shop_name: string;
  status: 'CRITICAL' | 'LOW' | 'OK';
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  total_amount: number;
  transaction_count: number;
  share_percent: number;
}

export interface WeeklyTrend {
  week_start: string;
  week_end: string;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
}

export interface BusinessContext {
  tenant_id: number;
  shop_id?: number;
  revenue_stats: RevenueStats;
  top_products: TopProduct[];
  category_breakdown: CategoryBreakdown[];
  shift_performance: ShiftPerformance[];
  inventory_alerts: InventoryAlert[];
  payment_methods: PaymentMethodBreakdown[];
  weekly_trends: WeeklyTrend[];
  monthly_trends: MonthlyTrend[];
  customer_stats: {
    total_customers: number;
    returning_customers: number;
    avg_loyalty_points: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AdvisorResponse {
  message: string;
  data_used: string[];
  suggestions?: string[];
}
