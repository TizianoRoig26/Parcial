from decimal import Decimal
from typing import List, Optional

from sqlmodel import Field, SQLModel


class DireccionCreate(SQLModel):
    alias: Optional[str] = Field(default=None, max_length=50)
    linea1: str = Field(min_length=2)
    linea2: Optional[str] = None
    ciudad: str = Field(min_length=2, max_length=100)
    provincia: Optional[str] = Field(default=None, max_length=100)
    codigo_postal: Optional[str] = Field(default=None, max_length=10)
    latitud: Optional[Decimal] = Field(default=None, ge=-90, le=90)
    longitud: Optional[Decimal] = Field(default=None, ge=-180, le=180)
    es_principal: bool = Field(default=False)


class DireccionUpdate(SQLModel):
    alias: Optional[str] = Field(default=None, max_length=50)
    linea1: Optional[str] = Field(default=None, min_length=2)
    linea2: Optional[str] = None
    ciudad: Optional[str] = Field(default=None, min_length=2, max_length=100)
    provincia: Optional[str] = Field(default=None, max_length=100)
    codigo_postal: Optional[str] = Field(default=None, max_length=10)
    latitud: Optional[Decimal] = Field(default=None, ge=-90, le=90)
    longitud: Optional[Decimal] = Field(default=None, ge=-180, le=180)
    es_principal: Optional[bool] = None


class DireccionPublic(SQLModel):
    id: int
    usuario_id: int
    alias: Optional[str] = None
    linea1: str
    linea2: Optional[str] = None
    ciudad: str
    provincia: Optional[str] = None
    codigo_postal: Optional[str] = None
    es_principal: bool


class DireccionList(SQLModel):
    data: List[DireccionPublic]
    total: int
