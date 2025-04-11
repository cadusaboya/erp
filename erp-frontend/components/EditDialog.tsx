import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface Field {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date";
  placeholder?: string;
  options?: { label: string; value: string }[]; // for selects
}

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: Field[];
  defaultValues: Record<string, string>; // 👈 values to prefill
  onSubmit: (formData: Record<string, string>) => void;
}

const EditDialog: React.FC<EditDialogProps> = ({ open, onClose, title, fields, defaultValues, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(defaultValues || {});
  }, [defaultValues, open]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium block mb-1">{field.label}</label>
              {field.type === "text" || field.type === "number" || field.type === "date" ? (
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              ) : field.type === "select" ? (
                <Select onValueChange={(val) => handleChange(field.key, val)} value={formData[field.key] || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDialog;