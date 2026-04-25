import { useState, type ChangeEvent } from "react";

export const useForm = <T extends Object>(initialState: T) => {
  const [formState, setFormState] = useState(initialState);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const inputName = e.target.name;
    const inputValue = e.target.value;
    setFormState((prev) => ({
      ...prev,
      [`${inputName}`]: inputValue,
    }));
  };

  return {
    formState,
    handleChange,
  };
};
