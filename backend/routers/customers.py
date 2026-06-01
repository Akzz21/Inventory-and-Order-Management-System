from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from database import get_db
from models import Customer
from schemas import CustomerCreate, CustomerUpdate, CustomerOut

router = APIRouter()


@router.get("/", response_model=List[CustomerOut])
def get_customers(
    search: Optional[str] = Query(None),
    skip:   int = Query(0, ge=0),
    limit:  int = Query(100, ge=1, le=500),
    db:     Session = Depends(get_db)
):
    query = db.query(Customer)
    if search:
        query = query.filter(
            or_(Customer.name.ilike(f"%{search}%"), Customer.email.ilike(f"%{search}%"))
        )
    return query.offset(skip).limit(limit).all()


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/", response_model=CustomerOut, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    # Check unique email
    existing = db.query(Customer).filter(Customer.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Email '{payload.email}' already registered")

    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    data = payload.model_dump(exclude_unset=True)

    # Check email uniqueness on update
    if "email" in data:
        conflict = db.query(Customer).filter(
            Customer.email == data["email"], Customer.id != customer_id
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already in use by another customer")

    for field, value in data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}
