import { Expense } from "@/types/expense";

function formatDateForCSV(date: Date): string {
  // Format YYYY-MM-DD
  return date.toISOString().split("T")[0];
}

function escapeCSV(str: string | null | undefined): string {
  if (str === null || str === undefined) {
    return "";
  }
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(expenses: Expense[], fileName: string) {
  // Hapus "ID" dari header
  const headers = ["Date", "Category", "Amount", "Notes"];
  const csvRows = [headers.join(",")];

  let totalAmount = 0;

  // Buat baris data
  for (const expense of expenses) {
    totalAmount += expense.amount; // Hitung total
    const row = [
      formatDateForCSV(expense.date.toDate()),
      escapeCSV(expense.category),
      expense.amount.toString(),
      escapeCSV(expense.notes),
      // Hapus expense.id
    ];
    csvRows.push(row.join(","));
  }

  // TAMBAHKAN BARIS TOTAL
  csvRows.push(""); // Baris kosong
  // "Date", "Category", "Amount", "Notes"
  // Tambah total di kolom ke-3 (Amount)
  csvRows.push(`,Total,${totalAmount.toString()}`);

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}