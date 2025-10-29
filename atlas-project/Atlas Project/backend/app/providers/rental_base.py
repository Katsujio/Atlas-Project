
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class IRentalDataProvider(ABC):
    @abstractmethod
    def get_property_details(self, address:str)->Dict[str,Any]: ...
    @abstractmethod
    def get_rent_estimate(self, address:str)->Dict[str,Any]: ...
    @abstractmethod
    def get_rent_comps(self, address:str, limit:int=10)->List[Dict[str,Any]]: ...
