# app/routes/land_leasing.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from uuid import uuid4, UUID
from datetime import datetime, date
from typing import Optional, List
from app.connections.postgres_connection import get_db
from app.schemas.postgres_base import User, LandParcel, Plot, LandLease, LeaseType, LeaseStatus, UserRole
from app.schemas.mongo_schema import setup_mongodb
from gridfs import GridFS
from bson import ObjectId
import json
import tempfile
import os

# For PDF generation (install with: pip install reportlab)
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


# ---------- MongoDB Setup ----------
mongodb = setup_mongodb()
fs = GridFS(mongodb, collection="lease_documents")

# ---------- Pydantic Models ----------
class PlotOption(BaseModel):
    id: str
    plot_name: str
    area: float
    village: str
    district: str
    state: str
    owner_name: str

class LandLeaseRequest(BaseModel):
    plot_id: str
    lessee_name: str
    lessee_contact: str
    lease_type: LeaseType
    lease_duration: str
    start_date: date
    end_date: date
    standard_terms: str | None = None
    special_conditions: str | None = None
    rent_amount: float | None = None
    rent_frequency: str | None = None
    security_deposit: float | None = None

class LeaseResponse(BaseModel):
    id: str
    plot_id: str
    lessor_id: str
    lessee_id: str
    lessee_name: str
    lessee_contact: str
    lease_type: str
    lease_duration: str
    start_date: date
    end_date: date
    standard_terms: str | None
    special_conditions: str | None
    rent_amount: float | None
    rent_frequency: str | None
    security_deposit: float | None
    agreement_generated: bool
    agreement_document_id: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Related data
    plot_info: dict | None = None
    lessor_info: dict | None = None

class LeaseListResponse(BaseModel):
    total_count: int
    leases: List[LeaseResponse]

class AgreementResponse(BaseModel):
    id: str
    lease_id: str
    document_id: Optional[str]  # Allow empty document_id
    filename: str
    generated_at: datetime
    lease_info: dict

lease_management_router = APIRouter()

# ---------- Route 1: Get Available Plots for Leasing ----------
@lease_management_router.get("/available-plots", response_model=List[PlotOption])
def get_available_plots(db: Session = Depends(get_db)):
    """
    Get all verified plots that are available for leasing
    """
    try:
        # Debug: Check all plots first
        all_plots = db.query(Plot).all()
        print(f"🔍 DEBUG: Total plots in database: {len(all_plots)}")
        
        if all_plots:
            print(f"🔍 DEBUG: First plot status: '{all_plots[0].status}', farmer_id: {all_plots[0].farmer_id}, parcel_id: {all_plots[0].parcel_id}")
            
        # Check available status values
        unique_statuses = db.query(Plot.status).distinct().all()
        print(f"🔍 DEBUG: Available plot statuses: {[s[0] for s in unique_statuses]}")
        
        # Get plots that are not currently leased (no active lease)
        # Try different status variations and use LEFT JOIN to avoid missing relationships
        plots_query = (
            db.query(Plot, User, LandParcel)
            .outerjoin(User, Plot.farmer_id == User.id)
            .outerjoin(LandParcel, Plot.parcel_id == LandParcel.id)
            .filter(Plot.status.in_(["ACTIVE", "PENDING_APPROVAL", "APPROVED"]))  # Accept multiple statuses
        )
        
        plots_data = plots_query.all()
        print(f"🔍 DEBUG: Plots after joins and ACTIVE filter: {len(plots_data)}")
        
        available_plots = []
        for plot, owner, parcel in plots_data:
            # Check if plot has active lease
            active_lease = (
                db.query(LandLease)
                .filter(
                    LandLease.plot_id == plot.id,
                    LandLease.status == LeaseStatus.active
                )
                .first()
            )
            
            if not active_lease:  # Plot is available
                available_plots.append(PlotOption(
                    id=str(plot.id),
                    plot_name=plot.plot_name or f"Plot {str(plot.id)[:8]}",
                    area=float(plot.area) if plot.area else 0.0,
                    village=plot.village or "Unknown",
                    district=plot.district or "Unknown", 
                    state=plot.state or "Unknown",
                    owner_name=owner.full_name if owner else "Unknown Owner"
                ))
            else:
                print(f"🔍 DEBUG: Plot {plot.id} has active lease: {active_lease.id}")
        
        print(f"🔍 DEBUG: Final available plots count: {len(available_plots)}")
        
        # If no plots found with joins, try a simple query
        if len(available_plots) == 0:
            print("🔍 DEBUG: No plots found with joins, trying simple query...")
            simple_plots = db.query(Plot).limit(5).all()
            for plot in simple_plots:
                available_plots.append(PlotOption(
                    id=str(plot.id),
                    plot_name=plot.plot_name or f"Plot {str(plot.id)[:8]}",
                    area=float(plot.area) if plot.area else 0.0,
                    village=plot.village or "Unknown",
                    district=plot.district or "Unknown", 
                    state=plot.state or "Unknown",
                    owner_name="Test Owner"
                ))
            print(f"🔍 DEBUG: Added {len(simple_plots)} plots from simple query")
        
        return available_plots
        
    except Exception as e:
        print(f"❌ ERROR in get_available_plots: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving available plots: {str(e)}"
        )

# ---------- Route 2: Create Land Lease ----------
@lease_management_router.post("/create-lease")
def create_land_lease(payload: LandLeaseRequest, db: Session = Depends(get_db)):
    """
    Create a new land lease agreement
    """
    print("🚀 CREATE LEASE ENDPOINT CALLED!")
    print(f"📋 Received payload: {payload}")
    print(f"📋 Payload plot_id: '{payload.plot_id}' (type: {type(payload.plot_id)})")
    try:
        # Convert plot_id to UUID if it's a string
        try:
            plot_uuid = UUID(payload.plot_id) if isinstance(payload.plot_id, str) else payload.plot_id
            print(f"✅ Successfully converted plot_id to UUID: {plot_uuid}")
        except ValueError as ve:
            print(f"❌ UUID conversion failed: {ve}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid plot_id format. Must be a valid UUID. Received: '{payload.plot_id}'"
            )
        
        # Verify plot exists and is available
        plot = db.query(Plot).filter(Plot.id == plot_uuid).first()
        if not plot:
            raise HTTPException(
                status_code=404,
                detail="Plot not found"
            )
        
        # Check if plot already has active lease
        active_lease = (
            db.query(LandLease)
            .filter(
                LandLease.plot_id == plot_uuid,
                LandLease.status == "active"
            )
            .first()
        )
        
        if active_lease:
            raise HTTPException(
                status_code=400,
                detail="Plot is already leased to another farmer"
            )
        
        # Get or create lessee user
        lessee = db.query(User).filter(User.phone == payload.lessee_contact).first()
        if not lessee:
            lessee = User(
                id=uuid4(),
                full_name=payload.lessee_name,
                phone=payload.lessee_contact,
                role=UserRole.farmer.value,  # Convert enum to string
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(lessee)
            db.commit()
            db.refresh(lessee)
        
        # Get lessor (plot owner) - make it optional for now
        lessor = db.query(User).filter(User.id == plot.farmer_id).first()
        lessor_id = lessor.id if lessor else lessee.id  # Use lessee as fallback
        
        print(f"🔍 Plot farmer_id: {plot.farmer_id}")
        print(f"🔍 Found lessor: {lessor.full_name if lessor else 'None'}")
        print(f"🔍 Using lessor_id: {lessor_id}")
        
        # Create lease
        lease = LandLease(
            id=uuid4(),
            plot_id=plot_uuid,
            lessor_id=lessor_id,
            lessee_id=lessee.id,
            lessee_name=payload.lessee_name,
            lessee_contact=payload.lessee_contact,
            lease_type=payload.lease_type,
            lease_duration=payload.lease_duration,
            start_date=payload.start_date,
            end_date=payload.end_date,
            standard_terms=payload.standard_terms,
            special_conditions=payload.special_conditions,
            rent_amount=payload.rent_amount,
            rent_frequency=payload.rent_frequency,
            security_deposit=payload.security_deposit,
            status=LeaseStatus.active,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(lease)
        db.commit()
        db.refresh(lease)
        
        return {
            "message": "✅ Land lease created successfully!",
            "lease_id": str(lease.id),
            "status": "pending"
        }
        
    except HTTPException as he:
        print(f"❌ HTTPException in create_land_lease: {he.detail}")
        db.rollback()
        raise he
    except Exception as e:
        print(f"❌ Unexpected error in create_land_lease: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating lease: {str(e)}"
        )

# ---------- Route 3: Generate Lease Agreement ----------
@lease_management_router.post("/generate-agreement/{lease_id}")
def generate_lease_agreement(lease_id: str, db: Session = Depends(get_db)):
    """
    Generate PDF agreement for a lease
    """
    try:
        # Convert lease_id to UUID
        try:
            lease_uuid = UUID(lease_id) if isinstance(lease_id, str) else lease_id
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid lease_id format. Must be a valid UUID."
            )
        
        # Get lease with related data
        lease = db.query(LandLease).filter(LandLease.id == lease_uuid).first()
        if not lease:
            raise HTTPException(
                status_code=404,
                detail="Lease not found"
            )
        
        # Get related data
        plot = db.query(Plot).filter(Plot.id == lease.plot_id).first()
        lessor = db.query(User).filter(User.id == lease.lessor_id).first()
        lessee = db.query(User).filter(User.id == lease.lessee_id).first()
        parcel = db.query(LandParcel).filter(LandParcel.id == plot.parcel_id).first()
        
        # Generate agreement content
        agreement_content = f"""
LAND LEASE AGREEMENT

This Land Lease Agreement is entered into on {datetime.now().strftime('%B %d, %Y')} between:

LESSOR (Owner):
Name: {lessor.full_name}
Phone: {lessor.phone}
Email: {lessor.email or 'N/A'}

LESSEE (Farmer):
Name: {lease.lessee_name}
Phone: {lease.lessee_contact}

PROPERTY DETAILS:
Plot Name: {plot.plot_name or 'N/A'}
Area: {plot.area} {parcel.acreage if parcel else 'N/A'} acres
Location: {plot.village}, {plot.mandal}, {plot.district}, {plot.state}
Survey Number: {plot.survey_no or 'N/A'}
Soil Type: {parcel.soil_type if parcel else 'N/A'}

LEASE TERMS:
Lease Type: {lease.lease_type.value}
Duration: {lease.lease_duration}
Start Date: {lease.start_date.strftime('%B %d, %Y')}
End Date: {lease.end_date.strftime('%B %d, %Y')}

FINANCIAL TERMS:
Rent Amount: ₹{lease.rent_amount if lease.rent_amount else 'As per agreement'}
Rent Frequency: {lease.rent_frequency or 'N/A'}
Security Deposit: ₹{lease.security_deposit if lease.security_deposit else 'N/A'}

STANDARD TERMS & CONDITIONS:
{lease.standard_terms or 'Standard agricultural lease terms apply.'}

SPECIAL CONDITIONS:
{lease.special_conditions or 'None'}

This agreement is binding upon both parties and their successors.

Lessor Signature: _____________________    Date: ___________

Lessee Signature: _____________________    Date: ___________

Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
Agreement ID: {lease_id}
        """
        
        # Create PDF or text file using in-memory approach
        if REPORTLAB_AVAILABLE:
            try:
                # Create PDF in memory using BytesIO
                from io import BytesIO
                buffer = BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=letter)
                styles = getSampleStyleSheet()
                story = []
                
                # Add content to PDF
                for line in agreement_content.strip().split('\n'):
                    if line.strip():
                        if line.strip().isupper() and len(line.strip()) < 50:
                            # Headers
                            story.append(Paragraph(line.strip(), styles['Heading2']))
                        else:
                            # Normal text
                            story.append(Paragraph(line.strip(), styles['Normal']))
                        story.append(Spacer(1, 6))
                
                # Build PDF in memory
                doc.build(story)
                
                # Get PDF content from memory
                pdf_content = buffer.getvalue()
                buffer.close()
                
                filename = f"lease_agreement_{lease_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                content_type = "application/pdf"
                
            except Exception as pdf_error:
                # Fallback to text if PDF generation fails
                print(f"PDF generation failed: {pdf_error}. Falling back to text format.")
                pdf_content = agreement_content.encode('utf-8')
                filename = f"lease_agreement_{lease_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
                content_type = "text/plain"
        else:
            # Create text file content
            pdf_content = agreement_content.encode('utf-8')
            filename = f"lease_agreement_{lease_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            content_type = "text/plain"
        
        # Store in MongoDB GridFS
        file_id = fs.put(
            pdf_content,
            filename=filename,
            content_type=content_type,
            lease_id=lease_id,
            generated_at=datetime.utcnow()
        )
        
        # Update lease record
        lease.agreement_generated = True
        lease.agreement_document_id = str(file_id)
        lease.status = LeaseStatus.active
        lease.updated_at = datetime.utcnow()
        db.commit()
        
        print(f"✅ DEBUG: Agreement generated and saved for lease {lease_id}")
        
        return {
            "message": "✅ Lease agreement generated successfully!",
            "agreement_id": str(file_id),
            "filename": filename,
            "lease_status": "active"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating agreement: {str(e)}"
        )

# ---------- Route 4: Get All Leases ----------
@lease_management_router.get("/all-leases", response_model=LeaseListResponse)
def get_all_leases(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all land leases regardless of status (for debugging)
    """
    try:
        # Get total count of all leases
        total_count = db.query(LandLease).count()
        
        # Get all leases with pagination
        leases = (
            db.query(LandLease)
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        # Build response (same logic as active leases)
        lease_responses = []
        for lease in leases:
            # Get plot info
            plot = db.query(Plot).filter(Plot.id == lease.plot_id).first()
            plot_info = None
            if plot:
                plot_info = {
                    "id": str(plot.id),
                    "plot_name": plot.plot_name,
                    "area": float(plot.area) if plot.area else None,
                    "village": plot.village,
                    "district": plot.district,
                    "state": plot.state
                }
            
            # Get lessor info
            lessor = db.query(User).filter(User.id == lease.lessor_id).first()
            lessor_info = None
            if lessor:
                lessor_info = {
                    "id": str(lessor.id),
                    "full_name": lessor.full_name,
                    "phone": lessor.phone,
                    "email": lessor.email
                }
            
            lease_responses.append(LeaseResponse(
                id=str(lease.id),
                plot_id=str(lease.plot_id),
                lessor_id=str(lease.lessor_id),
                lessee_id=str(lease.lessee_id),
                lessee_name=lease.lessee_name,
                lessee_contact=lease.lessee_contact,
                lease_type=lease.lease_type.value,
                lease_duration=lease.lease_duration,
                start_date=lease.start_date,
                end_date=lease.end_date,
                standard_terms=lease.standard_terms,
                special_conditions=lease.special_conditions,
                rent_amount=float(lease.rent_amount) if lease.rent_amount else None,
                rent_frequency=lease.rent_frequency,
                security_deposit=float(lease.security_deposit) if lease.security_deposit else None,
                agreement_generated=lease.agreement_generated,
                agreement_document_id=lease.agreement_document_id,
                status=lease.status.value,
                created_at=lease.created_at,
                updated_at=lease.updated_at,
                plot_info=plot_info,
                lessor_info=lessor_info
            ))
        
        return LeaseListResponse(
            total_count=total_count,
            leases=lease_responses
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving all leases: {str(e)}"
        )

# ---------- Route 5: Get Active Leases ----------
@lease_management_router.get("/active-leases", response_model=LeaseListResponse)
def get_active_leases(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all active land leases
    """
    try:
        # Get total count of active leases
        total_count = (
            db.query(LandLease)
            .filter(LandLease.status == LeaseStatus.active)
            .count()
        )
        
        # Get active leases with pagination
        leases = (
            db.query(LandLease)
            .filter(LandLease.status == LeaseStatus.active)
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        # Build response
        lease_responses = []
        for lease in leases:
            # Get plot info
            plot = db.query(Plot).filter(Plot.id == lease.plot_id).first()
            plot_info = None
            if plot:
                plot_info = {
                    "id": str(plot.id),
                    "plot_name": plot.plot_name,
                    "area": float(plot.area) if plot.area else None,
                    "village": plot.village,
                    "district": plot.district,
                    "state": plot.state
                }
            
            # Get lessor info
            lessor = db.query(User).filter(User.id == lease.lessor_id).first()
            lessor_info = None
            if lessor:
                lessor_info = {
                    "id": str(lessor.id),
                    "full_name": lessor.full_name,
                    "phone": lessor.phone,
                    "email": lessor.email
                }
            
            lease_responses.append(LeaseResponse(
                id=str(lease.id),
                plot_id=str(lease.plot_id),
                lessor_id=str(lease.lessor_id),
                lessee_id=str(lease.lessee_id),
                lessee_name=lease.lessee_name,
                lessee_contact=lease.lessee_contact,
                lease_type=lease.lease_type.value,
                lease_duration=lease.lease_duration,
                start_date=lease.start_date,
                end_date=lease.end_date,
                standard_terms=lease.standard_terms,
                special_conditions=lease.special_conditions,
                rent_amount=float(lease.rent_amount) if lease.rent_amount else None,
                rent_frequency=lease.rent_frequency,
                security_deposit=float(lease.security_deposit) if lease.security_deposit else None,
                agreement_generated=lease.agreement_generated,
                agreement_document_id=lease.agreement_document_id,
                status=lease.status.value,
                created_at=lease.created_at,
                updated_at=lease.updated_at,
                plot_info=plot_info,
                lessor_info=lessor_info
            ))
        
        return LeaseListResponse(
            total_count=total_count,
            leases=lease_responses
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving active leases: {str(e)}"
        )

# ---------- Route 5: Get All Agreements (Simplified) ----------
@lease_management_router.get("/agreements", response_model=List[AgreementResponse])
def get_all_agreements(db: Session = Depends(get_db)):
    """
    Get all generated lease agreements
    """
    try:
        print("🚀 DEBUG: get_all_agreements endpoint called")
        
        # First check if the LandLease table exists and what fields are available
        try:
            all_leases = db.query(LandLease).all()
            print(f"🔍 DEBUG: Total leases in database: {len(all_leases)}")
            
            if all_leases:
                # Check what fields are available on the first lease
                first_lease = all_leases[0]
                print(f"🔍 DEBUG: Available lease fields: {[attr for attr in dir(first_lease) if not attr.startswith('_')]}")
                print(f"🔍 DEBUG: Lease table name: {LandLease.__tablename__}")
                
                # Direct field check
                print(f"🔍 DEBUG: First lease agreement_generated: {first_lease.agreement_generated}")
                print(f"🔍 DEBUG: First lease agreement_document_id: {first_lease.agreement_document_id}")
        except Exception as table_error:
            print(f"❌ DEBUG: Error accessing LandLease table: {str(table_error)}")
            return []
        
        for lease in all_leases:
            # Handle potential AttributeError for agreement_generated
            try:
                agreement_generated = getattr(lease, 'agreement_generated', False)
                document_id = getattr(lease, 'agreement_document_id', None)
                print(f"🔍 DEBUG: Lease {lease.id}")
                print(f"  - lessee_name: {lease.lessee_name}")
                print(f"  - agreement_generated: {agreement_generated}")
                print(f"  - document_id: {document_id}")
                print(f"  - lease_type: {lease.lease_type}")
                print(f"  - status: {lease.status}")
                print(f"  - start_date: {lease.start_date}")
                print(f"  - end_date: {lease.end_date}")
            except Exception as attr_error:
                print(f"❌ DEBUG: Error accessing lease attributes: {str(attr_error)}")
        
        # Get all leases with generated agreements - handle case where field might not exist
        try:
            print(f"🔍 DEBUG: Attempting to query leases with agreement_generated=True")
            leases = (
                db.query(LandLease)
                .filter(LandLease.agreement_generated == True)
                .all()
            )
            print(f"🔍 DEBUG: Query successful, found {len(leases)} leases with agreement_generated=True")
        except Exception as filter_error:
            print(f"❌ DEBUG: Error filtering by agreement_generated: {str(filter_error)}")
            # Fallback: get all leases and filter manually
            print(f"🔍 DEBUG: Using manual filtering fallback")
            leases = []
            for lease in all_leases:
                try:
                    agreement_generated = getattr(lease, 'agreement_generated', False)
                    if agreement_generated:
                        leases.append(lease)
                        print(f"✅ DEBUG: Added lease {lease.id} (agreement_generated={agreement_generated})")
                except Exception as e:
                    print(f"❌ DEBUG: Error checking lease {lease.id}: {e}")
            print(f"🔍 DEBUG: Manual filtering found {len(leases)} leases")
        
        print(f"🔍 DEBUG: Found {len(leases)} leases with agreement_generated=True")
        
        agreements = []
        for lease in leases:
            print(f"🔍 DEBUG: Processing lease {lease.id}, document_id: {lease.agreement_document_id}")
            # Always process the lease, even if document metadata is missing
            try:
                # Set default values
                filename = f"lease_agreement_{lease.id}.pdf"
                generated_at = lease.updated_at
                
                # Try to get document metadata from MongoDB if document_id exists
                if lease.agreement_document_id:
                    try:
                        print(f"🔍 DEBUG: Looking for document with _id: {lease.agreement_document_id}")
                        doc_metadata = mongodb["lease_documents.files"].find_one(
                            {"_id": ObjectId(lease.agreement_document_id)}
                        )
                        
                        print(f"🔍 DEBUG: Document metadata found: {doc_metadata is not None}")
                        if doc_metadata:
                            print(f"🔍 DEBUG: Document metadata keys: {list(doc_metadata.keys())}")
                            filename = doc_metadata.get("filename", filename)
                            generated_at = doc_metadata.get("uploadDate", lease.updated_at)
                        
                    except Exception as mongo_error:
                        print(f"⚠️ DEBUG: MongoDB lookup failed: {str(mongo_error)}, using defaults")
                else:
                    print(f"🔍 DEBUG: No document_id for lease {lease.id}, using default filename")
                
                # Get lease info - these are required fields
                plot = db.query(Plot).filter(Plot.id == lease.plot_id).first()
                lessor = db.query(User).filter(User.id == lease.lessor_id).first()
                
                print(f"🔍 DEBUG: Plot found: {plot is not None}, Lessor found: {lessor is not None}")
                
                lease_info = {
                    "lease_id": str(lease.id),
                    "lessee_name": lease.lessee_name,
                    "lessor_name": lessor.full_name if lessor else "Unknown",
                    "plot_name": plot.plot_name if plot else "Unknown",
                    "lease_type": lease.lease_type.value,
                    "start_date": lease.start_date.isoformat(),
                    "end_date": lease.end_date.isoformat(),
                    "status": lease.status.value
                }
                
                print(f"🔍 DEBUG: Created lease_info: {lease_info}")
                
                # Create agreement response - use lease.id as fallback for document_id if not available
                agreement_response = AgreementResponse(
                    id=str(lease.agreement_document_id) if lease.agreement_document_id else str(lease.id),
                    lease_id=str(lease.id),
                    document_id=lease.agreement_document_id or str(lease.id),  # Use lease.id as fallback
                    filename=filename,
                    generated_at=generated_at,
                    lease_info=lease_info
                )
                
                print(f"🔍 DEBUG: Created agreement response successfully")
                agreements.append(agreement_response)
                
            except Exception as lease_error:
                print(f"❌ DEBUG: Error processing lease {lease.id}: {str(lease_error)}")
                import traceback
                print(f"❌ DEBUG: Full traceback: {traceback.format_exc()}")
                # Continue to next lease instead of failing completely
                continue
        
        print(f"🔍 DEBUG: Returning {len(agreements)} agreements")
        return agreements
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving agreements: {str(e)}"
        )

# ---------- Route 6: Get Lease by ID ----------
@lease_management_router.get("/lease/{lease_id}", response_model=LeaseResponse)
def get_lease_by_id(lease_id: str, db: Session = Depends(get_db)):
    """
    Get specific lease by ID with all details
    """
    try:
        # Convert lease_id to UUID
        try:
            lease_uuid = UUID(lease_id) if isinstance(lease_id, str) else lease_id
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid lease_id format. Must be a valid UUID."
            )
        
        lease = db.query(LandLease).filter(LandLease.id == lease_uuid).first()
        if not lease:
            raise HTTPException(
                status_code=404,
                detail="Lease not found"
            )
        
        # Get plot info
        plot = db.query(Plot).filter(Plot.id == lease.plot_id).first()
        plot_info = None
        if plot:
            plot_info = {
                "id": str(plot.id),
                "plot_name": plot.plot_name,
                "area": float(plot.area) if plot.area else None,
                "village": plot.village,
                "district": plot.district,
                "state": plot.state,
                "survey_no": plot.survey_no
            }
        
        # Get lessor info
        lessor = db.query(User).filter(User.id == lease.lessor_id).first()
        lessor_info = None
        if lessor:
            lessor_info = {
                "id": str(lessor.id),
                "full_name": lessor.full_name,
                "phone": lessor.phone,
                "email": lessor.email
            }
        
        return LeaseResponse(
            id=str(lease.id),
            plot_id=str(lease.plot_id),
            lessor_id=str(lease.lessor_id),
            lessee_id=str(lease.lessee_id),
            lessee_name=lease.lessee_name,
            lessee_contact=lease.lessee_contact,
            lease_type=lease.lease_type.value,
            lease_duration=lease.lease_duration,
            start_date=lease.start_date,
            end_date=lease.end_date,
            standard_terms=lease.standard_terms,
            special_conditions=lease.special_conditions,
            rent_amount=float(lease.rent_amount) if lease.rent_amount else None,
            rent_frequency=lease.rent_frequency,
            security_deposit=float(lease.security_deposit) if lease.security_deposit else None,
            agreement_generated=lease.agreement_generated,
            agreement_document_id=lease.agreement_document_id,
            status=lease.status.value,
            created_at=lease.created_at,
            updated_at=lease.updated_at,
            plot_info=plot_info,
            lessor_info=lessor_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving lease: {str(e)}"
        )

# ---------- Route 7: Download Agreement PDF ----------
@lease_management_router.get("/download-agreement/{document_id}")
def download_agreement(document_id: str):
    """
    Download lease agreement PDF
    """
    try:
        # Get document from GridFS
        grid_out = fs.get(ObjectId(document_id))
        
        return {
            "message": "Agreement ready for download",
            "document_id": document_id,
            "filename": grid_out.filename,
            "content_type": grid_out.content_type,
            "size": grid_out.length
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Agreement document not found: {str(e)}"
        )

# ---------- Debug Route: Get All Leases ----------
@lease_management_router.get("/debug/all-leases")
def get_all_leases_debug(db: Session = Depends(get_db)):
    """
    Debug endpoint to check all leases in the database
    """
    try:
        all_leases = db.query(LandLease).all()
        
        leases_data = []
        for lease in all_leases:
            leases_data.append({
                "id": str(lease.id),
                "lessee_name": lease.lessee_name,
                "lessee_contact": lease.lessee_contact,
                "lease_type": lease.lease_type.value if lease.lease_type else None,
                "status": lease.status.value if lease.status else None,
                "agreement_generated": getattr(lease, 'agreement_generated', None),
                "agreement_document_id": getattr(lease, 'agreement_document_id', None),
                "start_date": lease.start_date.isoformat() if lease.start_date else None,
                "end_date": lease.end_date.isoformat() if lease.end_date else None,
                "created_at": lease.created_at.isoformat() if lease.created_at else None,
                "updated_at": lease.updated_at.isoformat() if lease.updated_at else None,
            })
        
        return {
            "total_leases": len(leases_data),
            "leases": leases_data
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "total_leases": 0,
            "leases": []
        }

# ---------- Debug Route: Get Specific Lease ----------
@lease_management_router.get("/debug/lease/{lease_id}")
def get_specific_lease_debug(lease_id: str, db: Session = Depends(get_db)):
    """
    Debug endpoint to check a specific lease by ID
    """
    try:
        print(f"🔍 DEBUG: Looking for lease with ID: {lease_id}")
        
        # Try to find the lease by ID
        try:
            lease_uuid = UUID(lease_id)
            lease = db.query(LandLease).filter(LandLease.id == lease_uuid).first()
            
            if not lease:
                return {"error": f"Lease not found with ID: {lease_id}"}
            
            # Get all available fields
            lease_data = {
                "id": str(lease.id),
                "lessee_name": lease.lessee_name,
                "lessee_contact": lease.lessee_contact,
                "lease_type": lease.lease_type.value if lease.lease_type else None,
                "status": lease.status.value if lease.status else None,
                "agreement_generated": lease.agreement_generated,
                "agreement_document_id": lease.agreement_document_id,
                "start_date": lease.start_date.isoformat() if lease.start_date else None,
                "end_date": lease.end_date.isoformat() if lease.end_date else None,
                "created_at": lease.created_at.isoformat() if lease.created_at else None,
                "updated_at": lease.updated_at.isoformat() if lease.updated_at else None,
                "plot_id": str(lease.plot_id) if lease.plot_id else None,
                "lessor_id": str(lease.lessor_id) if lease.lessor_id else None,
                "lessee_id": str(lease.lessee_id) if lease.lessee_id else None,
            }
            
            # Also check related objects
            plot = db.query(Plot).filter(Plot.id == lease.plot_id).first()
            lessor = db.query(User).filter(User.id == lease.lessor_id).first()
            
            lease_data["plot_exists"] = plot is not None
            lease_data["lessor_exists"] = lessor is not None
            
            if plot:
                lease_data["plot_name"] = plot.plot_name
            if lessor:
                lease_data["lessor_name"] = lessor.full_name
            
            return {"lease": lease_data}
            
        except ValueError:
            return {"error": f"Invalid UUID format: {lease_id}"}
        
    except Exception as e:
        return {"error": str(e)}
