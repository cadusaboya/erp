import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BankOption {
  label: string;
  value: string;
}

interface CreatePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: Record<string, string>) => void;
  bankOptions: BankOption[];
}

const CreatePaymentDialog: React.FC<CreatePaymentDialogProps> = ({ open, onClose, onSubmit, bankOptions }) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    status: "pago",
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const cleanData = { ...formData };
  
    if (cleanData.status === "agendado") {
      cleanData.date = cleanData.scheduled_date
    } else if (cleanData.status === "pago") {
      delete cleanData.scheduled_date
    }
  
    onSubmit(cleanData);
    onClose();
    setFormData({ status: "pago" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div>
            <label className="text-sm font-medium block mb-1">Status</label>
            <Select value={formData.status || "pago"} onValueChange={(val) => handleChange("status", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="agendado">Agendado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data do pagamento (se status for pago) */}
          {formData.status === "pago" && (
            <div>
              <label className="text-sm font-medium block mb-1">Data do pagamento</label>
              <Input
                type="date"
                value={formData.date || ""}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>
          )}

          {/* Data do agendamento (se status for agendado) */}
          {formData.status === "agendado" && (
            <div>
              <label className="text-sm font-medium block mb-1">Data do agendamento</label>
              <Input
                type="date"
                value={formData.scheduled_date || ""}
                onChange={(e) => handleChange("scheduled_date", e.target.value)}
              />
            </div>
          )}

          {/* Valor */}
          <div>
            <label className="text-sm font-medium block mb-1">Valor</label>
            <Input
              type="number"
              placeholder="R$ 0,00"
              value={formData.value || ""}
              onChange={(e) => handleChange("value", e.target.value)}
            />
          </div>

          {/* Banco */}
          <div>
            <label className="text-sm font-medium block mb-1">Banco</label>
            <Select value={formData.bank || ""} onValueChange={(val) => handleChange("bank", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um banco" />
              </SelectTrigger>
              <SelectContent>
                {bankOptions.map((bank) => (
                  <SelectItem key={bank.value} value={bank.value}>
                    {bank.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documento */}
          <div>
            <label className="text-sm font-medium block mb-1">Documento</label>
            <Input
              type="text"
              placeholder="Nº do comprovante"
              value={formData.doc_number || ""}
              onChange={(e) => handleChange("doc_number", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePaymentDialog;
