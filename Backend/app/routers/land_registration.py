from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from uuid import uuid4, UUID
from sqlalchemy.orm import Session
from app.connections.postgres_connection import get_db
from app.schemas.postgres_base import LandParcel, Plot, User, Officer, UserRole, ApprovalStatus
from app.schemas.mongo_schema import setup_mongodb
from datetime import datetime

from gridfs import GridFS
from bson import ObjectId
import tempfile
import os
from PIL import Image, ImageEnhance
import pytesseract
import fitz

# Setup MongoDB and GridFS
mongodb = setup_mongodb()
fs = GridFS(mongodb)


# ---------- Pydantic Models ----------
class Location(BaseModel):
    village: str
    mandal: Optional[str]
    district: Optional[str]
    state: str

class Coordinates(BaseModel):
    latitude: str
    longitude: str

class LandRegistrationRequest(BaseModel):
    plotName: str
    ownerName: str
    contactNumber: str
    email: EmailStr | None = None
    size: float
    sizeUnit: str
    location: Location
    soilType: str | None = None
    waterSource: list[str] = []
    coordinates: Coordinates | None = None
    cropHistory: str | None = None
    infrastructure: list[str] = []


class PlotApprovalRequest(BaseModel):
    plot_id: UUID
    officer_id: UUID
    approval_status: ApprovalStatus
    notes: Optional[str] = None

class PlotStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

land_registration_router = APIRouter()

# ---------- Land Registration Routes ----------
@land_registration_router.post("/register")
async def register_plot(payload: LandRegistrationRequest, db: Session = Depends(get_db)):
    """
    Registers a new land plot in PostgreSQL with pending approval status.
    """
    print("🎯 Backend route hit! Received payload:", payload.dict())
    try:
        # Check if owner exists by phone/email, if not create a landowner user
        owner = None
        if payload.email:
            owner = db.query(User).filter(User.email == payload.email).first()
        if not owner and payload.contactNumber:
            owner = db.query(User).filter(User.phone == payload.contactNumber).first()
        
        # Create landowner if doesn't exist
        if not owner:
            # Generate email if not provided (due to NOT NULL constraint)
            user_email = payload.email if payload.email else f"landowner_{payload.contactNumber}@agrihub.local"
            
            owner = User(
                id=uuid4(),
                role=UserRole.landowner.value,  # Convert enum to string
                full_name=payload.ownerName,
                email=user_email,
                phone=payload.contactNumber,
                password_hash="placeholder_hash",  # Required field
                city=payload.location.village,
                state=payload.location.state,
            )
            db.add(owner)
            db.flush()

        # 1️⃣ Create LandParcel record
        land_parcel = LandParcel(
            id=uuid4(),
            owner_id=owner.id,
            acreage=payload.size,
            water_source=", ".join(payload.waterSource),
            soil_type=payload.soilType or "unknown",
        )
        db.add(land_parcel)
        db.flush()  # Get parcel ID before commit

        # 2️⃣ Create Plot record with PENDING status for approval
        plot = Plot(
            id=uuid4(),
            parcel_id=land_parcel.id,
            plot_name=payload.plotName,
            area=payload.size,
            crop_history=payload.cropHistory,
            status="PENDING_APPROVAL",  # Requires officer approval
            landowner_name=payload.ownerName,
            village=payload.location.village,
            mandal=payload.location.mandal,
            district=payload.location.district,
            state=payload.location.state
        )
        db.add(plot)
        db.commit()

        return {
            "message": "✅ Land plot registered successfully and pending approval!",
            "plot_id": str(plot.id),
            "parcel_id": str(land_parcel.id),
            "owner_id": str(owner.id),
            "status": "PENDING_APPROVAL"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error registering plot: {e}")

# ---------- Route 2: Upload Land Documents ----------
@land_registration_router.post("/upload_land_documents")
async def upload_land_documents(
    plot_id: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        allowed_types = ["application/pdf", "text/plain", "image/png", "image/jpeg"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Only PDF, text, or image files are allowed."
            )

        file_bytes = await file.read()

        # Store file in GridFS
        file_id = fs.put(
            file_bytes,
            filename=file.filename,
            content_type=file.content_type,
            plot_id=plot_id,
            uploaded_at=datetime.utcnow()
        )

        # Metadata
        metadata_doc = {
            "file_id": file_id,
            "filename": file.filename,
            "plot_id": plot_id,
            "content_type": file.content_type,
            "uploaded_at": datetime.utcnow(),
            "status": "uploaded",
            "description": "Land registration document",
        }
        mongodb["land_documents"].insert_one(metadata_doc)

        return {
            "message": "✅ Document uploaded successfully and metadata saved!",
            "document_id": str(file_id),
            "filename": file.filename
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@land_registration_router.get("/extract_land_report/{document_id}")
async def extract_land_report(document_id: str, db: Session = Depends(get_db)):
    try:
        # 🔍 1. Get metadata from MongoDB to find plot_id
        metadata = mongodb["land_documents"].find_one({"file_id": ObjectId(document_id)})
        if not metadata:
            raise HTTPException(status_code=404, detail="Document metadata not found in MongoDB.")

        plot_id = metadata.get("plot_id")
        if not plot_id:
            raise HTTPException(status_code=400, detail="Missing plot_id in metadata.")

        # 🧾 2. Fetch document from GridFS
        grid_out = fs.get(ObjectId(document_id))
        content_type = grid_out.content_type

        suffix = {
            "application/pdf": ".pdf",
            "text/plain": ".txt",
            "image/png": ".png",
            "image/jpeg": ".jpg"
        }.get(content_type, ".tmp")

        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(grid_out.read())
            tmp_path = tmp.name

        extracted_text = ""

        # 🧠 3. OCR / text extraction
        if content_type == "application/pdf":
            with fitz.open(tmp_path) as pdf:
                for page in pdf:
                    text = page.get_text("text")
                    if not text.strip():
                        pix = page.get_pixmap(dpi=400)
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        img = img.convert("L")
                        img = ImageEnhance.Contrast(img).enhance(2)
                        text = pytesseract.image_to_string(img, lang="eng")
                    extracted_text += text + "\n"

        elif content_type in ["image/png", "image/jpeg"]:
            img = Image.open(tmp_path)
            img = img.convert("L")
            img = ImageEnhance.Contrast(img).enhance(2)
            extracted_text = pytesseract.image_to_string(img, lang="eng")

        elif content_type == "text/plain":
            with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()

        os.remove(tmp_path)

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No readable text found.")

        # 🧾 4. Gemini prompt for land details extraction
        import re

        # Import and initialize Gemini model
        from google.generativeai import GenerativeModel
        model = GenerativeModel("gemini-pro")

        prompt = f"""
You are an expert AI trained in interpreting Indian property sale deeds and land registration documents.

Your task is to extract the **true current landowner(s)** — the buyer(s) or person(s) **receiving** the land, not the seller.

Follow these guidelines carefully:
1. The landowner is the person **in whose favor** the property is being transferred.
2. Keywords that usually indicate the owner/buyer:
   - "in favor of", "in favour of", "purchaser", "vendee", "grantee", "transferee", "donee", "beneficiary"
3. Ignore names appearing near:
   - "executed by", "vendor", "seller", "mortgagor", "donor", "assignor" (these are sellers).
4. Do not include witnesses, sub-registrar, or document writers.
5. If multiple owners are present, list them separated by commas.
6. Extract also the survey number(s), village, mandal/taluk, district, and state.

Return **only** valid JSON (no markdown or explanation):

{{
    "landowner_name": "Full name(s) of buyer(s)",
    "survey_no": "Survey number(s)",
    "village": "Village name",
    "mandal": "Mandal or Taluk name",
    "district": "District name",
    "state": "State name"
}}

Document text to analyze:
{extracted_text}
"""

        # 🧠 5. Generate Gemini response
        response = model.generate_content(prompt)
        raw_output = response.text.strip()

        # ---------- Clean Gemini Output ----------
        clean_text = re.sub(r"```json|```", "", raw_output).strip()
        clean_text = re.sub(r"(?i)^(Here.*?:|Sure.*?:|JSON\s*:)", "", clean_text).strip()

        # ---------- Parse JSON Safely ----------
        import json
        try:
            extracted_data = json.loads(clean_text)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse Gemini response as JSON. Raw output: {raw_output[:300]}"
            )

        # 🗃️ 6. Update PostgreSQL plot table
        plot = db.query(Plot).filter(Plot.id == plot_id).first()
        if plot:
            plot.landowner_name = extracted_data.get("landowner_name")
            plot.survey_no = extracted_data.get("survey_no")
            plot.village = extracted_data.get("village")
            plot.mandal = extracted_data.get("mandal")
            plot.district = extracted_data.get("district")
            plot.state = extracted_data.get("state")
            plot.updated_at = datetime.utcnow()
            db.commit()

        # 🧩 7. Save extraction result in MongoDB
        mongodb["land_documents"].update_one(
            {"file_id": ObjectId(document_id)},
            {"$set": {"extracted_info": extracted_data, "status": "processed"}}
        )

        return {
            "document_id": document_id,
            "plot_id": plot_id,
            "extracted_info": extracted_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting report: {str(e)}")


@land_registration_router.get("/pending-approvals")
def get_pending_plot_approvals(
    officer_id: Optional[UUID] = Query(None, description="Filter by officer jurisdiction"),
    db: Session = Depends(get_db)
):
    """
    Get all plots pending approval for officers.
    """
    query = db.query(Plot).filter(Plot.status == "PENDING_APPROVAL")
    
    # If officer_id provided, we could filter by jurisdiction
    # For now, return all pending plots
    pending_plots = query.all()
    
    # Get related information
    result = []
    for plot in pending_plots:
        parcel = db.query(LandParcel).filter(LandParcel.id == plot.parcel_id).first()
        owner = db.query(User).filter(User.id == parcel.owner_id).first() if parcel else None
        
        result.append({
            "plot": plot,
            "parcel": parcel,
            "owner": owner
        })
    
    return result

@land_registration_router.post("/approve/{plot_id}")
def approve_plot_registration(
    plot_id: UUID,
    approval: PlotApprovalRequest,
    db: Session = Depends(get_db)
):
    """
    Approve or reject a plot registration by an officer.
    """
    # Verify officer exists
    officer = db.query(Officer).filter(Officer.user_id == approval.officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    # Get the plot
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    # Update plot status based on approval
    if approval.approval_status == ApprovalStatus.approved:
        plot.status = "APPROVED"
    elif approval.approval_status == ApprovalStatus.rejected:
        plot.status = "REJECTED"
    else:
        plot.status = "PENDING_MODIFICATION"
    
    db.commit()
    db.refresh(plot)
    
    return {
        "message": f"Plot {approval.approval_status.value} successfully",
        "plot_id": plot_id,
        "new_status": plot.status,
        "approved_by": approval.officer_id
    }

@land_registration_router.put("/plots/{plot_id}/status")
def update_plot_status(
    plot_id: UUID,
    status_update: PlotStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update plot status (for general status management).
    """
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    plot.status = status_update.status
    db.commit()
    db.refresh(plot)
    
    return {
        "message": "Plot status updated successfully",
        "plot_id": plot_id,
        "new_status": plot.status
    }

@land_registration_router.get("/plots")
def get_all_plots(
    status: Optional[str] = Query(None, description="Filter by plot status"),
    skip: int = Query(0, description="Number of plots to skip"),
    limit: int = Query(100, description="Maximum number of plots to return"),
    db: Session = Depends(get_db)
):
    """
    Get all plots with detailed information including parcel and owner data.
    Supports filtering by status and pagination.
    """
    try:
        # Base query
        query = db.query(Plot)
        
        # Apply status filter if provided
        if status:
            query = query.filter(Plot.status == status.upper())
        
        # Get total count for pagination info
        total_count = query.count()
        
        # Apply pagination
        plots = query.offset(skip).limit(limit).all()
        
        # Build comprehensive response with related data
        result = []
        for plot in plots:
            # Get parcel information
            parcel = db.query(LandParcel).filter(LandParcel.id == plot.parcel_id).first()
            
            # Get owner information
            owner = None
            if parcel and parcel.owner_id:
                owner = db.query(User).filter(User.id == parcel.owner_id).first()
            
            # Get farmer information (if assigned)
            farmer = None
            if plot.farmer_id:
                farmer = db.query(User).filter(User.id == plot.farmer_id).first()
            
            # Build plot data
            plot_data = {
                "plot": {
                    "id": str(plot.id),
                    "plot_name": plot.plot_name,
                    "area": plot.area,
                    "status": plot.status,
                    "crop_history": plot.crop_history,
                    "landowner_name": plot.landowner_name,
                    "survey_no": plot.survey_no,
                    "village": plot.village,
                    "mandal": plot.mandal,
                    "district": plot.district,
                    "state": plot.state,
                    "created_at": plot.created_at,
                    "updated_at": plot.updated_at
                },
                "parcel": {
                    "id": str(parcel.id),
                    "acreage": parcel.acreage,
                    "water_source": parcel.water_source,
                    "soil_type": parcel.soil_type
                } if parcel else None,
                "owner": {
                    "id": str(owner.id),
                    "full_name": owner.full_name,
                    "email": owner.email,
                    "phone": owner.phone,
                    "role": (owner.role.value if hasattr(owner, 'role') and owner.role and hasattr(owner.role, 'value') else (owner.role if hasattr(owner, 'role') else None))
                } if owner else None,
                "farmer": {
                    "id": str(farmer.id),
                    "full_name": farmer.full_name,
                    "email": farmer.email,
                    "phone": farmer.phone,
                    "role": (farmer.role.value if hasattr(farmer, 'role') and farmer.role and hasattr(farmer.role, 'value') else (farmer.role if hasattr(farmer, 'role') else None))
                } if farmer else None
            }
            
            result.append(plot_data)
        
        return {
            "total_count": total_count,
            "returned_count": len(result),
            "skip": skip,
            "limit": limit,
            "plots": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving plots: {str(e)}")

@land_registration_router.get("/plots/{plot_id}")
def get_plot_details(plot_id: UUID, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific plot.
    """
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    parcel = db.query(LandParcel).filter(LandParcel.id == plot.parcel_id).first()
    owner = db.query(User).filter(User.id == parcel.owner_id).first() if parcel else None
    farmer = db.query(User).filter(User.id == plot.farmer_id).first() if plot.farmer_id else None
    
    return {
        "plot": plot,
        "parcel": parcel,
        "owner": owner,
        "farmer": farmer
    }









# from fastapi import APIRouter, UploadFile, File, Form, HTTPException
# from typing import List, Optional
# from uuid import uuid4
# from sqlalchemy.orm import sessionmaker
# from db.postgre_schema import setup_postgresql, LandParcel, Plot, LabReport
# import os
# import shutil

# router = APIRouter()

# # Database session
# engine = setup_postgresql()
# SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# # Folder to store uploaded documents
# UPLOAD_DIR = "uploads/plots"
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# @router.post("/register")
# async def register_plot(
#     plotName: str = Form(...),
#     ownerName: str = Form(...),
#     contactNumber: str = Form(...),
#     email: Optional[str] = Form(None),
#     size: float = Form(...),
#     sizeUnit: str = Form(...),
#     village: str = Form(...),
#     mandal: Optional[str] = Form(None),
#     district: Optional[str] = Form(None),
#     state: str = Form(...),
#     soilType: Optional[str] = Form(None),
#     waterSource: Optional[str] = Form(None),
#     latitude: str = Form(...),
#     longitude: str = Form(...),
#     cropHistory: Optional[str] = Form(None),
#     infrastructure: Optional[str] = Form(None),
#     landTitle: Optional[UploadFile] = File(None),
#     surveyDocument: Optional[UploadFile] = File(None)
# ):
#     """
#     Register a land plot and upload documents (title & survey).
#     """
#     db = SessionLocal()
#     try:
#         # --- 1️⃣ Save uploaded files ---
#         uploaded_files = []
#         for file_field, upload in [("land_title", landTitle), ("survey_document", surveyDocument)]:
#             if upload:
#                 file_ext = os.path.splitext(upload.filename)[1]
#                 file_name = f"{file_field}_{uuid4()}{file_ext}"
#                 file_path = os.path.join(UPLOAD_DIR, file_name)
                
#                 with open(file_path, "wb") as f:
#                     shutil.copyfileobj(upload.file, f)
#                 uploaded_files.append(file_path)

#         # --- 2️⃣ Create LandParcel record ---
#         land_parcel = LandParcel(
#             id=uuid4(),
#             acreage=size,
#             water_source=waterSource,
#             soil_type=soilType or "unknown",
#         )
#         db.add(land_parcel)
#         db.flush()

#         # --- 3️⃣ Create Plot record ---
#         plot = Plot(
#             id=uuid4(),
#             parcel_id=land_parcel.id,
#             plot_name=plotName,
#             area=size,
#             crop_history=cropHistory,
#         )
#         db.add(plot)
#         db.flush()

#         # --- 4️⃣ Store uploaded docs (optional) ---
#         for path in uploaded_files:
#             report = LabReport(
#                 id=uuid4(),
#                 plot_id=plot.id,
#                 summary="Land document uploaded",
#                 attachment_url=path
#             )
#             db.add(report)

#         db.commit()

#         return {
#             "message": "✅ Land plot registered successfully!",
#             "plot_id": str(plot.id),
#             "parcel_id": str(land_parcel.id),
#             "uploaded_files": uploaded_files
#         }

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Error registering plot: {e}")
#     finally:
#         db.close()
