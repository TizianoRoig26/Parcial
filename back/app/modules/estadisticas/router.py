from datetime import date
from typing import Annotated
from app.core.deps import require_role
from app.modules.usuario.model import Usuario
from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.core.database import get_session
from app.modules.estadisticas.service import EstadisticaService
from app.modules.estadisticas.schemas import (
    ResumenKPIsPublic,
    ProductoTopPublic,
    VentasPeriodoPublic,
    PedidosEstadoPublic,
    IngresosFormaPagoPublic
)

router = APIRouter()


def get_Estadisticas_service(session: Session = Depends(get_session)) -> EstadisticaService:
    return EstadisticaService(session)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/resumen", response_model=ResumenKPIsPublic, summary="Obtener resumen de KPIs de estadísticas")
def get_resumen_kpis(
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    svc: EstadisticaService = Depends(get_Estadisticas_service),
) -> ResumenKPIsPublic:
    return svc.get_resumen_kpis()


@router.get("/productos-top", response_model=list[ProductoTopPublic], summary="Obtener los productos más vendidos")
def get_productos_top(
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    svc: EstadisticaService = Depends(get_Estadisticas_service),
) -> list[ProductoTopPublic]:
    return svc.get_productos_top(limit=limit)


@router.get("/ventas", response_model=list[VentasPeriodoPublic], summary="Obtener ventas agrupadas por periodo")
def get_ventas_periodo(
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    desde: date,
    hasta: date,
    agrupacion: Annotated[str, Query(pattern="^(day|week|month)$")] = "day",
    svc: EstadisticaService = Depends(get_Estadisticas_service),
) -> list[VentasPeriodoPublic]:
    return svc.get_ventas_periodo(desde=desde, hasta=hasta, agrupacion=agrupacion)


@router.get("/pedidos-por-estado", response_model=list[PedidosEstadoPublic], summary="Obtener cantidad de pedidos por cada estado")
def get_pedidos_por_estado(
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    svc: EstadisticaService = Depends(get_Estadisticas_service),
) -> list[PedidosEstadoPublic]:
    return svc.get_pedidos_por_estado()


@router.get("/ingresos", response_model=list[IngresosFormaPagoPublic], summary="Obtener ingresos agrupados por forma de pago")
def get_ingresos_por_forma_pago(
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    desde: date,
    hasta: date,
    svc: EstadisticaService = Depends(get_Estadisticas_service),
) -> list[IngresosFormaPagoPublic]:
    return svc.get_ingresos_por_forma_pago(desde=desde, hasta=hasta)