from datetime import datetime
from typing import List
from pydantic import BaseModel

class AddMoneyRequest(BaseModel):
    amount: float
    payment_method: str = "UPI"

class WalletTransactionResponse(BaseModel):
    id: int
    transaction_type: str
    amount: float
    reference: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True

class WalletResponse(BaseModel):
    balance: float
    transactions: List[WalletTransactionResponse] = []

    class Config:
        from_attributes = True
