import Select, { SingleValue, StylesConfig } from "react-select";

export interface DropdownOption {
  value: string;
  label: string;
}

const dropdownStyles: StylesConfig<DropdownOption, false> = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? "#b3791b" : "#d8cfc3",
    borderRadius: 8,
    boxShadow: "none",
    fontSize: "0.95rem",
    "&:hover": { borderColor: "#b3791b" },
  }),
  placeholder: (base) => ({ ...base, color: "#8a7d70" }),
  singleValue: (base) => ({ ...base, color: "#2a2320" }),
  menu: (base) => ({ ...base, border: "1px solid #ece4d8", borderRadius: 8, overflow: "hidden", zIndex: 5 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#7a4a1e" : state.isFocused ? "#f1ebe1" : "#fff",
    color: state.isSelected ? "#fff" : "#2a2320",
    cursor: "pointer",
  }),
};

interface SearchableDropdownProps {
  inputId?: string;
  options: DropdownOption[];
  value: string | null | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
}

export function SearchableDropdown({
  inputId,
  options,
  value,
  onChange,
  placeholder,
  isClearable = true,
  isDisabled = false,
}: SearchableDropdownProps) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Select<DropdownOption, false>
      inputId={inputId}
      className="searchable-dropdown"
      classNamePrefix="searchable-dropdown"
      styles={dropdownStyles}
      options={options}
      value={selected}
      onChange={(opt: SingleValue<DropdownOption>) => onChange(opt?.value ?? undefined)}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      isSearchable
    />
  );
}
