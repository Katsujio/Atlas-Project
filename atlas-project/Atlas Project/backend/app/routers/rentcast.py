from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from app.providers.rentcast import RentCastProvider
from app.deps import get_current_user
from app.models import User
from app import schemas

router = APIRouter(prefix="/integrations/rentcast", tags=["integrations"])

@router.get("/preview", response_model=schemas.RentCastPreview)
def preview_rent_data(
    address: str,
    _: Annotated[User, Depends(get_current_user)],
):
    provider = RentCastProvider()
    try:
        details = provider.get_property_details(address)
        estimate = provider.get_rent_estimate(address)
        comps = provider.get_rent_comps(address, limit=8)
        return {"details": details, "estimate": estimate, "comps": comps}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"RentCast error: {e}")
