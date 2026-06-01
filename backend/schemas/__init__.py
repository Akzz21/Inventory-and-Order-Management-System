from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from models import OrderStatus


# ─── Product Schemas ────────────────────────────────────────────
class ProductBase(BaseModel):
    name:        str
    sku:         str
    description: Optional[str] = ""
    price:       float
    stock:       int
    category:    Optional[str] = "General"
    image_url: Optional[str] = ""

    @field_validator("price")
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

    @field_validator("stock")
    def stock_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError("Stock cannot be negative")
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name:        Optional[str] = None
    description: Optional[str] = None
    price:       Optional[float] = None
    stock:       Optional[int] = None
    category:    Optional[str] = None

class ProductOut(ProductBase):
    id:         int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True


# ─── Customer Schemas ───────────────────────────────────────────
class CustomerBase(BaseModel):
    name:    str
    email:   EmailStr
    phone:   Optional[str] = ""
    address: Optional[str] = ""

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name:    Optional[str] = None
    email:   Optional[EmailStr] = None
    phone:   Optional[str] = None
    address: Optional[str] = None

class CustomerOut(CustomerBase):
    id:         int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True


# ─── Order Schemas ──────────────────────────────────────────────
class OrderItemCreate(BaseModel):
    product_id: int
    quantity:   int

    @field_validator("quantity")
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be at least 1")
        return v

class OrderItemOut(BaseModel):
    id:         int
    product_id: int
    quantity:   int
    unit_price: float
    product:    Optional[ProductOut] = None
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: int
    notes:       Optional[str] = ""
    items:       List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    notes:  Optional[str] = None

class OrderOut(BaseModel):
    id:          int
    customer_id: int
    status:      OrderStatus
    total_price: float
    notes:       Optional[str]
    created_at:  Optional[datetime]
    updated_at:  Optional[datetime]
    customer:    Optional[CustomerOut] = None
    order_items: List[OrderItemOut] = []
    class Config:
        from_attributes = True


# ─── Dashboard Stats ────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_products:  int
    total_customers: int
    total_orders:    int
    total_revenue:   float
    low_stock_count: int
    pending_orders:  int
