import React from "react";

const FormInput = ({ type, label, placeholder, value, onChange, options }) => {
  const base = "glass-input w-full p-4 rounded-xl text-sm";
  const fileStyles = type === "file" ? "file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neon-emerald/20 file:text-neon-emerald hover:file:bg-neon-emerald/30 cursor-pointer p-[11px]" : "";

  return (
    <label className="w-full flex flex-col gap-2">
      <span className="text-sm font-semibold text-text-secondary px-1">{label}</span>

      {type === "textarea" ? (
        <textarea
          className={`${base} resize-none`}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          rows="5"
          spellCheck="false"
        />
      ) : type === "select" ? (
        <select
          className={`${base} cursor-pointer`}
          onChange={onChange}
          value={value}
        >
          {options?.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          className={`${base} ${fileStyles}`}
          placeholder={placeholder}
          onChange={onChange}
          type={type}
          value={type === "file" ? undefined : value}
          step={type === "number" ? "0.01" : undefined}
          min={type === "number" ? "0" : undefined}
          accept={type === "file" ? "image/png, image/jpeg, image/jpg, image/webp, image/gif" : undefined}
          spellCheck="false"
        />
      )}
    </label>
  );
};

export default FormInput;
