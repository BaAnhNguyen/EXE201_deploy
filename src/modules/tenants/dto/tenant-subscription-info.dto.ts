export interface TenantSubscriptionInfoDto {
  tenant_id: number;
  tenant_name: string;
  tenant_is_active: boolean;
  subscription_id: number | null;
  package_code: string | null;
  description: string | null;
  price: number | null;
  billing_cycle: string | null;
  start_date: string | null;
  end_date: string | null;
  is_expired: boolean;
  number_of_renewals: number | null;
}
