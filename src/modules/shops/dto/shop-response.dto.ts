export interface ShopResponseDto {
  id: number;
  tenant_id: number;
  shop_name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  update_at: string;
}
