from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.modules.estadisticas.repository import EstadisticasRepository

class EstadisticaUnitOfWork(UnitOfWork):

    def __init__(self, session: Session) -> None:
        super().__init__(session)
        self.Estadisticas = EstadisticasRepository(session)
