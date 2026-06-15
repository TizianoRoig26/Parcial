from datetime import date
from decimal import Decimal
from sqlmodel import Session
from app.modules.estadisticas.unit_of_work import EstadisticaUnitOfWork
from app.modules.estadisticas.schemas import (
    ResumenKPIsPublic,
    VentasPeriodoPublic,
    ProductoTopPublic,
    PedidosEstadoPublic,
    IngresosFormaPagoPublic
)

class EstadisticaService:

    def __init__(self, session: Session) -> None:
        self._session = session

    def get_resumen_kpis(self) -> ResumenKPIsPublic:
        with EstadisticaUnitOfWork(self._session) as uow:
            row = uow.Estadisticas.get_resumen_kpis()
            return ResumenKPIsPublic(
                ventas_hoy=Decimal(str(row.ventas_hoy or "0.00")),
                ticket_promedio=Decimal(str(row.ticket_promedio or "0.00")),
                pedidos_activos=row.pedidos_activos or 0,
                mes_actual=row.mes_actual,
                total_mes_actual=Decimal(str(row.total_mes_actual or "0.00")),
                cantidad_pedidos_mes=row.cantidad_pedidos_mes or 0,
            )

    def get_productos_top(self, limit: int = 10) -> list[ProductoTopPublic]:
        with EstadisticaUnitOfWork(self._session) as uow:
            rows = uow.Estadisticas.get_productos_top(limit=limit)
            return [
                ProductoTopPublic(
                    id=row.id,
                    nombre=row.nombre,
                    total_ventas=Decimal(str(row.total_ventas or "0.00")),
                    cantidad_pedidos=int(row.cantidad_pedidos or 0)
                ) for row in rows
            ]

    def get_ventas_periodo(self, desde: date, hasta: date, agrupacion: str) -> list[VentasPeriodoPublic]:
        with EstadisticaUnitOfWork(self._session) as uow:
            rows = uow.Estadisticas.get_ventas_periodo(desde=desde, hasta=hasta, agrupacion=agrupacion)
            return [
                VentasPeriodoPublic(
                    periodo=row.periodo,
                    total_ventas=Decimal(str(row.total_ventas or "0.00")),
                    cantidad_pedidos=int(row.cantidad_pedidos or 0)
                ) for row in rows
            ]

    def get_pedidos_por_estado(self) -> list[PedidosEstadoPublic]:
        with EstadisticaUnitOfWork(self._session) as uow:
            rows = uow.Estadisticas.get_pedidos_por_estado()
            return [
                PedidosEstadoPublic(
                    estado_codigo=row.estado_codigo,
                    cantidad_pedidos=int(row.cantidad_pedidos or 0)
                ) for row in rows
            ]

    def get_ingresos_por_forma_pago(self, desde: date, hasta: date) -> list[IngresosFormaPagoPublic]:
        with EstadisticaUnitOfWork(self._session) as uow:
            rows = uow.Estadisticas.get_ingresos_por_forma_pago(desde=desde, hasta=hasta)
            return [
                IngresosFormaPagoPublic(
                    id=row.id,
                    nombre=row.nombre,
                    total_ventas=Decimal(str(row.total_ventas or "0.00")),
                    cantidad_pedidos=int(row.cantidad_pedidos or 0)
                ) for row in rows
            ]