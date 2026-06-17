from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime, func


class Imagen(SQLModel, table=True):
    __tablename__ = "imagenes"

    id: Optional[int] = Field(default=None, primary_key=True)
    public_id: str = Field(max_length=500, unique=True)
    url: str = Field(max_length=1000)
    filename: str = Field(max_length=255)
    format: Optional[str] = Field(default=None, max_length=20)
    width: Optional[int] = Field(default=None)
    height: Optional[int] = Field(default=None)
    bytes: Optional[int] = Field(default=None)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )
    deleted_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )