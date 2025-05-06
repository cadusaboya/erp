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
  label: string
  value: string
}

interface ComboboxProps {
  options?: ComboboxOption[];
  value: string | number | undefined; // aceita mais formatos
  onChange: (value: string) => void; // mantém como string (você força isso internamente)
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

  const selectedLabel = internalOptions.find((o) => o.value === value)?.label;

  const handleSearch = async (query: string) => {
    if (!loadOptions) return;
    setLoading(true);
    const results = await loadOptions(query);
    setInternalOptions(results);
    setLoading(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className="justify-between px-3 py-2 text-sm font-normal"
          style={{
            width: `${Math.max(
              ((selectedLabel || placeholder)?.length ?? 10) * 8 + 32,
              150
            )}px`,
          }}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={!loadOptions}>
          <CommandInput
            placeholder="Buscar..."
            className="h-9"
            onValueChange={(query) => {
              if (loadOptions) handleSearch(query);
            }}
          />
          <CommandList>
            {loading && <CommandItem>Carregando...</CommandItem>}
            {!loading && internalOptions.length === 0 && <CommandEmpty>Nenhum resultado.</CommandEmpty>}
            <CommandGroup>
              {internalOptions.map((option) => (
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
