import React, { useState, useEffect } from "react";
import type { IProducto } from "../IProducto";
import type { ICategoria } from "../../categoria/ICategoria";
import type { IIngrediente } from "../../ingredientes/IIngredientes";
import type { IUnidadMedida } from "../../unidadMedida/IUnidadMedida";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<IProducto, "id" | "categorias" | "ingredientes">, categoriaIds: number[], ingredienteIds: number[]) => void;
  productoParaEditar?: IProducto | null;
  categoriasDisponibles: ICategoria[];
  ingredientesDisponibles: IIngrediente[];
  unidadesMedidaDisponibles: IUnidadMedida[];
  onAssignCategorias?: (ids: number[]) => void;
  onAssignIngredientes?: (ids: number[]) => void;
}

export const ProductoModal = ({
  isOpen,
  onClose,
  onSubmit,
  productoParaEditar,
  categoriasDisponibles,
  ingredientesDisponibles,
  unidadesMedidaDisponibles,
  onAssignCategorias,
  onAssignIngredientes,
}: Props) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioBase, setPrecioBase] = useState(0);
  const [stockCantidad, setStockCantidad] = useState(0);
  const [imagenUrl, setImagenUrl] = useState("");
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [selectedIngredientes, setSelectedIngredientes] = useState<number[]>([]);
  const [selectedUnidadMedida, setSelectedUnidadMedida] = useState<number>(0);

  useEffect(() => {
    if (productoParaEditar) {
      setNombre(productoParaEditar.nombre);
      setDescripcion(productoParaEditar.descripcion);
      setPrecioBase(productoParaEditar.precio_base);
      setStockCantidad(productoParaEditar.stock_cantidad);
      setImagenUrl(productoParaEditar.imagen_url);
      setSelectedCategorias(productoParaEditar.categorias?.map(c => c.id!) ?? []);
      setSelectedIngredientes(productoParaEditar.ingredientes?.map(i => i.id!) ?? []);
      setSelectedUnidadMedida(productoParaEditar.unidad_medida?.id ?? 0);
    } else {
      setNombre(""); setDescripcion(""); setPrecioBase(0);
      setStockCantidad(0); setImagenUrl("");
      setSelectedCategorias([]); setSelectedIngredientes([]);
    }
  }, [productoParaEditar, isOpen]);

  if (!isOpen) return null;

  const toggleId = (list: number[], id: number) =>
    list.includes(id) ? list.filter(x => x !== id) : [...list, id];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      { nombre, descripcion, precio_base: precioBase, stock_cantidad: stockCantidad, imagen_url: imagenUrl, unidad_venta_id: selectedUnidadMedida || undefined },
      selectedCategorias,
      selectedIngredientes,
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#E5E4C1] border-1 border-[#0D4012] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="px-8 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 gap-4 pt-5">
            <h2 className="text-black text-xl font-bold">
              {productoParaEditar ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                <input type="text" required minLength={2} maxLength={100} value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Nombre del producto" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL de Imagen</label>
                <input type="url" required value={imagenUrl}
                  onChange={e => setImagenUrl(e.target.value)}
                  className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                  placeholder="https://..." />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
              <textarea required minLength={2} maxLength={500} value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                placeholder="Descripción del producto" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio base ($)</label>
                <input type="number" required min={0} value={precioBase} 
                  onChange={e => setPrecioBase(Number(e.target.value))}
                  className="w-50 border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm" title="precio"/>
              </div>
              <div className="flex flex-row gap-3 items-center justify-center">
                  <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock</label>
                  <input type="number" required min={0} value={stockCantidad}
                    onChange={e => setStockCantidad(Number(e.target.value))}
                    className="w-25 border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm" title="stock"/>
                  </div>
                  <div>
                    <label className=" block text-sm font-semibold text-gray-700 mb-1.5">Medida</label>
                    <select required value={selectedUnidadMedida}
                      onChange={e => setSelectedUnidadMedida(Number(e.target.value))}
                      className="w-25 border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm" title="unidad de medida">
                      {unidadesMedidaDisponibles.map(unidad => (
                        <option key={unidad.id} value={unidad.id}>
                          {unidad.simbolo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
            </div>

            {/* Categorías */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categorías</label>
              <div className="custom-scrollbar border border-[#0D4012] bg-[#F4F3CF] rounded-xl overflow-y-auto max-h-20 divide-y divide-gray-100">
                {categoriasDisponibles.length === 0 && (
                  <p className="text-xs text-gray-400 px-4 py-3">No hay categorías disponibles</p>
                )}
                {categoriasDisponibles.map(cat => (
                  <label key={cat.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#E5E4C1] transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedCategorias.includes(cat.id!)}
                      onChange={() => setSelectedCategorias(prev => toggleId(prev, cat.id!))}
                      className="w-4 h-4 rounded accent-[#40A360] cursor-pointer"
                    />
                    <span className="text-sm text-gray-800">{cat.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ingredientes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ingredientes</label>
              <div className="custom-scrollbar border border-[#0D4012] bg-[#F4F3CF] rounded-xl overflow-y-auto max-h-20 divide-y divide-gray-100">
                {ingredientesDisponibles.length === 0 && (
                  <p className="text-xs text-gray-400 px-4 py-3">No hay ingredientes disponibles</p>
                )}
                {ingredientesDisponibles.map(ing => (
                  <label key={ing.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#E5E4C1] transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIngredientes.includes(ing.id!)}
                      onChange={() => setSelectedIngredientes(prev => toggleId(prev, ing.id!))}
                      className="w-4 h-4 rounded accent-[#40A360] cursor-pointer"
                    />
                    <span className="text-sm text-gray-800">
                      {ing.es_alergeno}
                      {ing.nombre}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 py-4">
            <button type="button" onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-black bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancelar
            </button>
            <button type="submit" key="guardar"
              className="px-6 py-2 bg-[#47AA66] text-black font-semibold rounded-xl shadow-lg">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
