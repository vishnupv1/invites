import { useId } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
};

export function UnderlineField({ label, value, onChange, placeholder, name, autoComplete, inputMode = "text" }: Props) {
  const id = useId();
  return (
    <div className="ir-field">
      <label className="ir-overline" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
