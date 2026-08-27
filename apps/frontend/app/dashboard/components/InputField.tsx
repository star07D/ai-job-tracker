import { ReactNode } from "react";

interface InputFieldProps {
  icon: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export default function InputField({
  icon,
  placeholder,
  value,
  onChange,
}: InputFieldProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-4 text-slate-500">{icon}</div>

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500"
      />
    </div>
  );
}
