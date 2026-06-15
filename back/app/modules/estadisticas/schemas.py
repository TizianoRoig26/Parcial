from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlmodel import SQLModel

class ResumenKPIsPublic(SQLModel):
    ventas_hoy: Optional[Decimal] = Decimal("0.00")
    ticket_promedio: Optional[Decimal] = Decimal("0.00")
    pedidos_activos: int = 0
    mes_actual: Optional[datetime] = None
    total_mes_actual: Optional[Decimal] = Decimal("0.00")
    cantidad_pedidos_mes: int = 0

class VentasPeriodoPublic(SQLModel):
    periodo: datetime
    total_ventas: Decimal
    cantidad_pedidos: int

class ProductoTopPublic(SQLModel):
    id: int
    nombre: str
    total_ventas: Decimal
    cantidad_pedidos: int

class PedidosEstadoPublic(SQLModel):
    estado_codigo: str
    cantidad_pedidos: int

class IngresosFormaPagoPublic(SQLModel):
    id: Optional[str] = None
    nombre: str
    total_ventas: Decimal
    cantidad_pedidos: int

class EstadisticaGeneralPublic(SQLModel):
    kpis: ResumenKPIsPublic
    ventas_periodo: List[VentasPeriodoPublic]
    productos_top: List[ProductoTopPublic]
    pedidos_por_estado: List[PedidosEstadoPublic]
    ingresos_por_forma_pago: List[IngresosFormaPagoPublic]
