import type { ICategoria } from "../types/ICategoria";

const BASE_URL = `${import.meta.env.VITE_API_URL}/categorias`;

export const createCategory = async (
  newCategory: Omit<ICategoria, "id">,
): Promise<ICategoria> => {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCategory),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al crear la categoría");
    }
    const data: ICategoria = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    throw error; 
  }
};

export const getCategorias = async (): Promise<{ data: ICategoria[]; total: number }> => {

  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error("Error al obtener las categorías");
    const data = await response.json();
    return data;
  } catch (error) {

    console.log(error);
    throw error; 
  }
};

export const getCategoriaById = async (id: number): Promise<ICategoria> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`);
    const data: ICategoria = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    throw error; 
  }
};

export const updateCategory = async (
  id: string,
  category: Partial<ICategoria>,
): Promise<ICategoria> => {
  try {
    const { nombre, descripcion, imagen_url, parent_id } = category;
    const body = { nombre, descripcion, imagen_url, parent_id };

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = typeof errorData.detail === 'string' 
        ? errorData.detail 
        : JSON.stringify(errorData.detail);
      throw new Error(errorMessage || "Error al actualizar la categoría");
    }


    const data: ICategoria = await response.json();
    console.log(data)
    return data;
  } catch (error) {
    console.error("Error en updateCategory:", error);
    throw error;
  }
};


export const deleteCategory = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Error al eliminar la categoría ${id}`);
    }
    return;
  } catch (error) {
    console.log(error);
    throw error; 
  }
};

