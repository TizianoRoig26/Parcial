from datetime import datetime, date
from sqlmodel import Session, select, func
from sqlalchemy import desc
from app.core.repository import BaseRepository
from app.modules.pedido.models import Pedido, FormaPago, DetallePedido
from app.modules.producto.models import Producto

class EstadisticasRepository(BaseRepository):

    def __init__(self, session: Session) -> None:        
        super().__init__(session, Pedido)

    def get_ventas_periodo(self, desde: date, hasta: date, agrupacion: str):
        stmt = (
            select(
                func.date_trunc(agrupacion, Pedido.created_at).label("periodo"),
                func.sum(Pedido.total).label("total_ventas"),
                func.count(Pedido.id).label("cantidad_pedidos")
            )
            .where(func.date(Pedido.created_at).between(desde, hasta))
            .where(Pedido.deleted_at == None)
            .where(Pedido.estado_codigo != "CANCELADO")    
            .where(Pedido.pagado == True)    
            .group_by(func.date_trunc(agrupacion, Pedido.created_at))
            .order_by(func.date_trunc(agrupacion, Pedido.created_at))
        )
        return self.session.exec(stmt).all()

    def get_productos_top(self, limit: int = 10):
        stmt = (
            select(
                Producto.id,
                Producto.nombre,
                func.sum(DetallePedido.subtotal_snap).label("total_ventas"),
                func.sum(DetallePedido.cantidad).label("cantidad_pedidos")
            )
            .where(DetallePedido.producto_id == Producto.id)
            .where(DetallePedido.pedido_id == Pedido.id)
            .where(Pedido.deleted_at == None) 
            .where(Pedido.pagado == True)
            .where(Pedido.estado_codigo != "CANCELADO")
            .group_by(Producto.id, Producto.nombre)
            .order_by(desc(func.sum(DetallePedido.cantidad)))
            .limit(limit)
        )
        return self.session.exec(stmt).all()

    def get_pedidos_por_estado(self):
        stmt = (
            select(
                Pedido.estado_codigo,
                func.count(Pedido.id).label("cantidad_pedidos")
            )
            .where(Pedido.deleted_at == None) 
            .group_by(Pedido.estado_codigo)
        )
        return self.session.exec(stmt).all()
        
    def get_resumen_kpis(self):
        ventas_hoy_stmt = (
            select(
                func.sum(Pedido.total)
            )
            .where(Pedido.deleted_at == None) 
            .where(Pedido.pagado == True)    
            .where(Pedido.estado_codigo != "CANCELADO")   
            .where(func.date(Pedido.created_at) == func.current_date())
        )
        ventas_hoy = self.session.exec(ventas_hoy_stmt).first()

        ticket_stmt = (
            select(
                func.avg(Pedido.total)
            )
            .where(Pedido.deleted_at == None) 
            .where(Pedido.pagado == True)   
            .where(Pedido.estado_codigo != "CANCELADO")  
            .where(func.date(Pedido.created_at) == func.current_date())
        )
        ticket_promedio = self.session.exec(ticket_stmt).first()

        activos_stmt = (
            select(
                func.count(Pedido.id)
            )
            .where(Pedido.deleted_at == None) 
            .where(Pedido.estado_codigo != "CANCELADO")
            .where(Pedido.estado_codigo != "ENTREGADO")    
            .where(func.date(Pedido.created_at) == func.current_date())
        )
        pedidos_activos = self.session.exec(activos_stmt).first()

        inicio_mes_actual = datetime(datetime.now().year, datetime.now().month, 1)
        mes_stmt = (
            select(
                func.date_trunc("month", Pedido.created_at).label("mes_actual"),
                func.sum(Pedido.total).label("total_mes_actual"),
                func.count(Pedido.id).label("cantidad_pedidos_mes")
            )
            .where(Pedido.deleted_at == None) 
            .where(Pedido.pagado == True)    
            .where(Pedido.estado_codigo != "CANCELADO")   
            .where(Pedido.created_at >= inicio_mes_actual)
            .group_by(func.date_trunc("month", Pedido.created_at))
        )
        res_mes = self.session.exec(mes_stmt).first()

        class ResumenRow:
            pass

        row = ResumenRow()
        row.ventas_hoy = ventas_hoy or 0.0
        row.ticket_promedio = ticket_promedio or 0.0
        row.pedidos_activos = pedidos_activos or 0
        row.mes_actual = res_mes.mes_actual if res_mes else None
        row.total_mes_actual = res_mes.total_mes_actual if res_mes else 0.0
        row.cantidad_pedidos_mes = res_mes.cantidad_pedidos_mes if res_mes else 0
        return row

    def get_ingresos_por_forma_pago(self, desde: date, hasta: date):
        stmt = (
             select(
                FormaPago.codigo.label("id"),
                FormaPago.descripcion.label("nombre"),
                func.sum(Pedido.total).label("total_ventas"),
                func.count(Pedido.id).label("cantidad_pedidos")
            )
            .where(Pedido.forma_pago_codigo == FormaPago.codigo)
            .where(Pedido.deleted_at == None) 
            .where(Pedido.pagado == True)
            .where(Pedido.estado_codigo != "CANCELADO")     
            .where(func.date(Pedido.created_at).between(desde, hasta))
            .group_by(FormaPago.codigo, FormaPago.descripcion)
        )
        return self.session.exec(stmt).all()