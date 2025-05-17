"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxOption {
  label: string // ex: "20101 | Folha de Pagamento"
  value: string
}

interface ComboboxProps {
  options?: ComboboxOption[];
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loadOptions?: (query: string) => Promise<ComboboxOption[]>;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options = [],
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
  loadOptions,
}) => {
  const [open, setOpen] = React.useState(false);
  const [internalOptions, setInternalOptions] = React.useState<ComboboxOption[]>(options);
  const [loading, setLoading] = React.useState(false);
  const [filterQuery, setFilterQuery] = React.useState("");

  const selectedLabel = internalOptions.find((o) => String(o.value) === String(value))?.label;

  const handleSearch = async (query: string) => {
    if (!loadOptions) return;
    setLoading(true);
    const results = await loadOptions(query);
    setInternalOptions(results);
    setLoading(false);
  };

  const filteredOptions = React.useMemo(() => {
    if (loadOptions) return internalOptions;

    return internalOptions.filter((option) => {
      const [code, ...nameParts] = option.label.toLowerCase().split("|");
      const name = nameParts.join("|").trim(); // in case the name itself has '|'
      const query = filterQuery.toLowerCase();

      return (
        code.trim().startsWith(query) ||
        name.includes(query)
      );
    });
  }, [internalOptions, filterQuery, loadOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className="justify-between px-3 py-2 text-sm font-normal truncate"
          style={{
            width: `${Math.max(
              ((selectedLabel || placeholder)?.length ?? 10) * 8 + 40,
              150
            )}px`,
          }}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar..."
            className="h-9"
            onValueChange={(query) => {
              setFilterQuery(query);
              if (loadOptions) handleSearch(query);
            }}
          />
          <CommandList>
            {loading && <CommandItem>Carregando...</CommandItem>}
            {!loading && filteredOptions.length === 0 && (
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
