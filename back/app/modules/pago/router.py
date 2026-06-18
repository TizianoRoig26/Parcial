# app/modules/payments/router.py — Endpoints REST para la integración con MercadoPago
#
# Endpoints expuestos:
#
#   POST /api/v1/pagos/create-preference  → Crea una preferencia de pago en MP
#   POST /api/v1/pagos/webhook            → Recibe notificaciones de MP (webhook)
#   POST /api/v1/pagos/confirm            → Consulta/confirma estado de un pago
#   GET  /api/v1/pagos/redirect/{id}/{s}  → Redirige al frontend después del pago
#
# FLUJO COMPLETO:
#   1. Frontend → POST /create-preference  → Recibe init_point + preference_id
#   2. Frontend redirige a MP checkout (init_point)
#   3. Usuario paga en MP
#   4. MP → POST /webhook (nos notifica)
#   5. MP redirige al usuario → GET /redirect/{id}/{status}
#   6. (Opcional) Frontend → POST /confirm  → Verifica estado final
#
import logging
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session

from app.core.config import settings
from app.core.database import get_session
from app.modules.pago.schemas import (
    CrearPagoRequest,
    ConfirmarPagoRequest,
    PagoCrearResponse,
    PagoEstadoResponse,
)
from app.modules.pago.service import PaymentService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_payment_service(session: Session = Depends(get_session)) -> PaymentService:
    """Factory para inyectar el servicio de pagos como dependencia de FastAPI."""
    return PaymentService(session)


@router.post("/create-preference", response_model=PagoCrearResponse)
def create_preference(
    data: CrearPagoRequest,
    svc: PaymentService = Depends(get_payment_service),
):
    """
    PASO 1 DEL FLUJO:
    Crea una preferencia de pago en MercadoPago para un pedido.

    El frontend llama a este endpoint cuando el usuario hace clic en "Pagar".
    La respuesta incluye:
      - init_point: URL del checkout de MP (el frontend redirige aquí)
      - preference_id: ID de la preferencia en MP
      - public_key: clave pública para el SDK de MP en el frontend
    """
    return svc.crear_pago(data.pedido_id)


@router.post("/webhook")
async def webhook(
    request: Request,
    svc: PaymentService = Depends(get_payment_service),
):
    """
    PASO 4 DEL FLUJO:
    Endpoint que recibe notificaciones de MercadoPago (webhook).

    MP nos envía una notificación POST cuando un pago cambia de estado.
    El payload puede llegar como JSON o form-data, y también puede
    incluir datos en query params.

    Este endpoint SIEMPRE devuelve 200 para que MP no reintente.
    Los errores se loguean y se devuelven en el body, no como HTTP error.
    """
    try:
        query_params = dict(request.query_params)
        if request.headers.get("content-type", "").startswith("application/json"):
            data = await request.json()
        else:
            data = dict(await request.form())
        return await svc.procesar_webhook(data, query_params=query_params)
    except Exception as e:
        logger.exception("Error en webhook MP")
        return {"status": "error", "reason": str(e)}


@router.post("/confirm", response_model=PagoEstadoResponse)
async def confirm_payment(
    data: ConfirmarPagoRequest,
    svc: PaymentService = Depends(get_payment_service),
):
    """
    PASO 6 DEL FLUJO (opcional):
    Consulta y sincroniza el estado actual de un pago con MercadoPago.

    El frontend llama a este endpoint para verificar si el pago fue
    aprobado, rechazado o sigue pendiente. Es útil cuando:
      - El webhook aún no llegó
      - El usuario volvió a la página después de pagar en MP
      - Se necesita refrescar el estado manualmente
    """
    return await svc.confirmar_pago(data.pedido_id, data.payment_id)


@router.get("/redirect/{pedido_id}/{status}")
async def redirect_after_pago(
    pedido_id: int,
    status: str,
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Endpoint de redirección post-pago.

    Después de que el usuario paga (o no) en MP, MP redirige el navegador
    a la URL que configuramos en back_urls de la preferencia:
      /redirect/{pedido_id}/success  → pago aprobado
      /redirect/{pedido_id}/failure  → pago rechazado
      /redirect/{pedido_id}/pending  → pago pendiente

    Este endpoint redirige al catálogo del frontend del cliente y,
    si el estado es 'success', marca el pedido realizado como pagado.
    """
    if status == "success":
        from app.modules.pedido.unit_of_work import PedidosUnitOfWork
        from app.modules.pedido.service import PedidoService
        from app.modules.pedido.schemas import PedidoEstadoUpdate
        from datetime import datetime

        with PedidosUnitOfWork(session) as uow:
            pedido = uow.pedidos.get_by_id(pedido_id)
            if pedido:
                pedido.pagado = True
                pedido.updated_at = datetime.utcnow()
                uow.pedidos.update(pedido)

        try:
            pedido_uow = PedidosUnitOfWork(session)
            pedido_svc = PedidoService(pedido_uow)
            pedido_obj = pedido_uow.pedidos.get_by_id(pedido_id)
            if pedido_obj and pedido_obj.estado_codigo == "PENDIENTE":
                await pedido_svc.avanzar_estado(
                    pedido_id=pedido_id,
                    data=PedidoEstadoUpdate(
                        estado_hacia="CONFIRMADO",
                        motivo="Pago aprobado vía redirección de checkout"
                    ),
                    usuario_id=None,
                    roles_usuario=["admin"]
                )
        except Exception as e:
            logger.error(f"Error al avanzar estado de pedido {pedido_id} post-redireccion: {e}")

    frontend_cliente_url = settings.FRONTEND_CLIENTE_URL
    qs = request.url.query
    url = f"{frontend_cliente_url}/catalogo"
    if qs:
        url += f"?{qs}"
    return RedirectResponse(url=url)
