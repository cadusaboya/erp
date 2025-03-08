import { useState, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EditContaDialog = ({ open, onClose, conta, onSave }) => {
  const [formData, setFormData] = useState({
    description: "",
    value: "",
    date_due: "",
  });

  // Load selected Conta data into the form
  useEffect(() => {
    if (conta) {
      setFormData({
        description: conta.description || "",
        value: conta.value || "",
        date_due: conta.date_due || "",
      });
    }
  }, [conta]);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = () => {
    onSave({ ...conta, ...formData });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>

        {/* Form Fields */}
        <div className="space-y-3">
          <Input
            name="description"
            placeholder="Descrição"
            value={formData.description}
            onChange={handleChange}
          />
          <Input
            name="value"
            type="number"
            placeholder="Valor"
            value={formData.value}
            onChange={handleChange}
          />
          <Input
            name="date_due"
            type="date"
            value={formData.date_due}
            onChange={handleChange}
          />
        </div>

        {/* Footer Buttons */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditContaDialog;
