from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.session import get_db
from backend.app.db.models import Department, Ward
from backend.app.schemas.departments import DepartmentResponse, WardResponse

router = APIRouter()

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).filter(Department.is_active == True).all()
    # If empty, return standard default municipal departments without fake hardcoded dynamic data
    if not depts:
        return []
    return depts

@router.get("/departments/{dept_id}", response_model=DepartmentResponse)
def get_department(dept_id: str, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@router.get("/wards", response_model=List[WardResponse])
def get_wards(db: Session = Depends(get_db)):
    wards = db.query(Ward).filter(Ward.is_active == True).all()
    return wards

@router.get("/wards/{ward_id}", response_model=WardResponse)
def get_ward(ward_id: str, db: Session = Depends(get_db)):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    return ward
