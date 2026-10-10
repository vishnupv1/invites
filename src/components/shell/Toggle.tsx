type Props = {
  label: string;
  pressed: boolean;
  onChange: (pressed: boolean) => void;
};

export function Toggle({ label, pressed, onChange }: Props) {
  return (
    <button className="ir-toggle" type="button" aria-pressed={pressed} aria-label={label} onClick={() => onChange(!pressed)}>
      <span className="ir-toggle-knob" />
    </button>
  );
}
