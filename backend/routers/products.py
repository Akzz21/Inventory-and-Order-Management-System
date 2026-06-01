from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from database import get_db
from models import Product
from schemas import ProductCreate, ProductUpdate, ProductOut

router = APIRouter()


@router.get("/", response_model=List[ProductOut])
def get_products(
    search:   Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip:     int = Query(0, ge=0),
    limit:    int = Query(100, ge=1, le=500),
    db:       Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        query = query.filter(
            or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(Product.category == category)
    return query.offset(skip).limit(limit).all()


@router.get("/low-stock", response_model=List[ProductOut])
def get_low_stock(threshold: int = Query(10), db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.stock <= threshold).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    # Check unique SKU
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"SKU '{payload.sku}' already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
