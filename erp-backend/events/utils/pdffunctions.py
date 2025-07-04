from decimal import Decimal

def get_event_rows(event, model, user, mode):
    rows = []
    is_bill = model.__name__ == "Bill"
    items = model.objects.filter(user=user, event_allocations__event_id=event.id).distinct()

    for item in items:
        allocation = item.event_allocations.filter(event_id=event.id).first()
        if not allocation or not item.value:
            continue

        if mode == "accruals":
            value = allocation.value
        else:
            ratio = allocation.value / item.value
            total_paid_to_event = sum(p.value * ratio for p in item.payments.all())

            if mode == "payments":
                for p in item.payments.all():
                    rows.append({
                        "id": p.id,
                        "date": p.date,
                        "person": item.person.name,
                        "description": item.description,
                        "doc_number": p.doc_number or "DN",
                        "value": round(p.value * ratio, 2),
                        "is_bill": is_bill,
                    })
                continue
            elif mode == "remaining":
                value = allocation.value - total_paid_to_event
                if value <= 0:
                    continue
            else:
                continue

        rows.append({
            "id": item.id,
            "date": item.date_due,
            "person": item.person.name,
            "description": item.description,
            "doc_number": item.doc_number or "DN",
            "value": round(value, 2),
            "is_bill": is_bill,
        })
    return rows

def draw_header(pdf, width, height, event_name, event_id, title):
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(width * 0.06, height - 40, "Arquitetura de Eventos")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(width * 0.06, height - 60, title)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(50, height - 110, f"{event_id} - {event_name}")

    pdf.setFont("Helvetica-Bold", 9)
    y = height - 140

    # ✅ MATCH columns with your table body
    cols = [50, width * 0.12, width * 0.18, width * 0.24, width * 0.5, width * 0.84, width * 0.9]

    pdf.drawString(cols[0], y, "Nro.")
    pdf.drawString(cols[1], y, "Data")
    pdf.drawString(cols[2], y, "Previsão")
    pdf.drawString(cols[3], y, "Favorecido")
    pdf.drawString(cols[4], y, "Memo")
    pdf.drawString(cols[5], y, "Doc.")
    pdf.drawString(cols[6], y, "Valor")

    y -= 5
    pdf.line(width * 0.05, y, width * 0.95, y)
    return y - 15


def check_page_break(pdf, y, height, width, event_name, event_id, title):
    if y < 50:
        pdf.showPage()
        return draw_header(pdf, width, height, event_name, event_id, title)
    return y

def draw_rows(pdf, rows, y, width, height, section_title, cols, event_name, event_id, title, is_income=False, total_label=None):
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(40, y, section_title)
    y -= 15

    for row in rows:
        y = check_page_break(pdf, y, height, width, event_name, event_id, title)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(cols[0], y, str(row["id"]))
        pdf.drawString(cols[1], y, row["date"].strftime("%d/%m/%y"))
        pdf.drawString(cols[2], y, row["person"])
        pdf.drawString(cols[3], y, row["description"])
        pdf.drawString(cols[4], y, row["doc_number"])
        val = row["value"]
        pdf.drawString(cols[5], y, f"{'-' if row['is_bill'] else ''}{val:.2f}")
        y -= 15

    total = sum(r["value"] for r in rows)
    y = check_page_break(pdf, y - 2, height, width, event_name, event_id, title)
    pdf.setFont("Helvetica-Bold", 9)
    label = total_label or (f"Total {'a Pagar' if not is_income else 'a Receber'}")
    pdf.drawString(cols[4], y, label)
    pdf.drawString(cols[5], y, f"{'-' if not is_income else ''}{total:.2f}")
    return y - 25, total

def truncate_text(text, max_length):
    return (text[:max_length] + '...') if len(text) > max_length else text
