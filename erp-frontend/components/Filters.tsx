import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface FiltersDialogProps<T extends object> {
  filters: T;
  setFilters: (filters: T) => void;
  open: boolean;
  onClose: () => void;
  applyFilters: (filters: T) => void;
  clearFilters: () => void;
  filterFields: {
    key: keyof T;
    type: "text" | "number" | "date" | "checkboxes";
    label: string;
    placeholder?: string;
    options?: string[]; // only for checkboxes
  }[];
}

const FiltersDialog = <T extends object>({
  filters, setFilters, open, onClose, applyFilters, clearFilters, filterFields,
}: FiltersDialogProps<T>) => {
  const [draftFilters, setDraftFilters] = useState<T>(filters);

  useEffect(() => {
    if (open) {
      setDraftFilters(filters); // Sync with parent when dialog opens
    }
  }, [open, filters]);

  const handleCheckboxChange = (key: keyof T, value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: Array.isArray(prev[key]) && (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter((v) => v !== value)
        : [...((prev[key] as string[]) || []), value],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-auto min-w-[350px] max-w-4xl">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {filterFields.map((field) => {
            if (field.type === "checkboxes") {
              return (
                <div key={String(field.key)} className="border p-2 rounded-md bg-white shadow-md">
                  <label className="block font-semibold mb-2">{field.label}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {field.options?.map((option) => (
                        <label key={option} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Array.isArray(draftFilters[field.key]) && draftFilters[field.key]?.includes(option)}
                            onChange={() => handleCheckboxChange(field.key, option)}
                          />
                          <span>
                            {option
                              .split(" ")
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                              .join(" ")}
                          </span>
                        </label>
                      ))}
                    </div>
                </div>
              );
            } else {
              return (
                <Input
                  key={String(field.key)}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(draftFilters[field.key] as string) || ""}
                  onChange={(e) =>
                    setDraftFilters({ ...draftFilters, [field.key]: e.target.value } as T)
                  }
                />
              );
            }
          })}
        </div>

        <DialogFooter>
          <Button onClick={() => { clearFilters(); onClose(); }} variant="outline">
            Limpar Filtros
          </Button>
          <Button
            onClick={() => {
              applyFilters(draftFilters);
              setFilters(draftFilters);
              onClose();
            }}
          >
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiltersDialog;
