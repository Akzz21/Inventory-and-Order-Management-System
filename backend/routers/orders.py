from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models import Order, OrderItem, Product, Customer, OrderStatus
from schemas import OrderCreate, OrderUpdate, OrderOut, DashboardStats

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    total_products  = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders    = db.query(Order).count()
    total_revenue   = db.query(func.sum(Order.total_price)).filter(
        Order.status != OrderStatus.cancelled
    ).scalar() or 0.0
    low_stock_count = db.query(Product).filter(Product.stock <= 10).count()
    pending_orders  = db.query(Order).filter(Order.status == OrderStatus.pending).count()

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        low_stock_count=low_stock_count,
        pending_orders=pending_orders,
    )


@router.get("/", response_model=List[OrderOut])
def get_orders(
    status:      Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    skip:        int = Query(0, ge=0),
    limit:       int = Query(100, ge=1, le=500),
    db:          Session = Depends(get_db)
):
    query = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.order_items).joinedload(OrderItem.product)
    )
    if status:
        query = query.filter(Order.status == status)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.order_items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    # Validate stock for all items BEFORE making any changes
    total_price = 0.0
    validated_items = []

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")

        # ✅ BUSINESS RULE: Check sufficient stock
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock}, Requested: {item.quantity}"
            )

        validated_items.append((product, item.quantity))
        total_price += product.price * item.quantity

    # All validations passed — create order
    order = Order(
        customer_id=payload.customer_id,
        total_price=round(total_price, 2),
        notes=payload.notes or ""
    )
    db.add(order)
    db.flush()

    # Create order items and reduce stock
    for product, quantity in validated_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price
        )
        db.add(order_item)

        # ✅ BUSINESS RULE: Automatic stock reduction
        product.stock -= quantity

    db.commit()
    db.refresh(order)

    return db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.order_items).joinedload(OrderItem.product)
    ).filter(Order.id == order.id).first()


@router.put("/{order_id}", response_model=OrderOut)
def update_order(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # If cancelling, restore stock
    if payload.status == OrderStatus.cancelled and order.status != OrderStatus.cancelled:
        for item in order.order_items:
            item.product.stock += item.quantity

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)

    db.commit()
    db.refresh(order)

    return db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.order_items).joinedload(OrderItem.product)
    ).filter(Order.id == order.id).first()


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.order_items)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Restore stock if not cancelled
    if order.status != OrderStatus.cancelled:
        for item in order.order_items:
            item.product.stock += item.quantity

    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}
