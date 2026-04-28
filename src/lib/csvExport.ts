/**
 * Utility to export transaction data to CSV
 */
export function exportToCSV(data: any[], filename: string = 'transactions.csv') {
  if (!data || !data.length) return;

  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => {
      const date = new Date(row.date).toLocaleDateString();
      const description = `"${row.description.replace(/"/g, '""')}"`;
      const category = row.category || 'Other';
      const type = row.type;
      const amount = row.amount;
      
      return [date, description, category, type, amount].join(',');
    })
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
