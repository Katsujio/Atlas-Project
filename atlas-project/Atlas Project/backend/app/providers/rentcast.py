
import os, httpx, time
from typing import Dict, Any, List
from .rental_base import IRentalDataProvider

RENTCAST_URL = os.getenv("RENTCAST_BASE_URL", "https://api.rentcast.io")
API_KEY = os.getenv("RENTCAST_API_KEY", "")

class RentCastProvider(IRentalDataProvider):
    def __init__(self, client: httpx.Client | None = None):
        headers = {"X-Api-Key": API_KEY} if API_KEY else {}
        self.client = client or httpx.Client(headers=headers, timeout=20)

    def _get(self, path: str, params: Dict[str, Any]):
        for i in range(3):
            r = self.client.get(f"{RENTCAST_URL}{path}", params=params)
            if r.status_code == 429:
                time.sleep(2**i); continue
            r.raise_for_status()
            return r.json()
        raise RuntimeError("RentCast rate limited repeatedly")

    def get_property_details(self, address: str)->Dict[str, Any]:
        return self._get("/v1/properties", {"address": address})

    def get_rent_estimate(self, address: str)->Dict[str, Any]:
        return self._get("/v1/rents/estimate", {"address": address})

    def get_rent_comps(self, address: str, limit: int = 10)->List[Dict[str, Any]]:
        return self._get("/v1/rents/comps", {"address": address, "limit": limit})
