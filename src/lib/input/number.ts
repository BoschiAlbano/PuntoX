export const handleNumberInput = (
  val: string,
  onChange: (value: string) => void,
) => {
  const value = val.replace(".", ",");
  if (/^\d*,?\d*$/.test(value)) {
    onChange(value);
  }
};
