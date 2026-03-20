export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDataForExport(data: any[], type: 'tasks' | 'materials' | 'timesheets' | 'photos' | 'sites') {
  switch (type) {
    case 'tasks':
      return data.map(item => ({
        'Task ID': item.id,
        'Title': item.title,
        'Description': item.description || '',
        'Site': item.sites?.name || '',
        'Assigned To': item.profiles?.full_name || '',
        'Status': item.status,
        'Created': new Date(item.created_at).toLocaleString(),
        'Completed': item.completed_at ? new Date(item.completed_at).toLocaleString() : '',
      }));

    case 'materials':
      return data.map(item => ({
        'Material ID': item.id,
        'Item Name': item.item_name,
        'Quantity': item.quantity,
        'Site': item.sites?.name || '',
        'Requested By': item.profiles?.full_name || '',
        'Comment': item.comment || '',
        'Status': item.status,
        'Created': new Date(item.created_at).toLocaleString(),
      }));

    case 'timesheets':
      return data.map(item => ({
        'Timesheet ID': item.id,
        'Worker': item.profiles?.full_name || '',
        'Site': item.sites?.name || '',
        'Date': item.date,
        'Hours': item.hours,
        'Work Type': item.work_type,
        'Notes': item.notes || '',
        'Created': new Date(item.created_at).toLocaleString(),
      }));

    case 'photos':
      return data.map(item => ({
        'Photo ID': item.id,
        'Description': item.description || '',
        'Task': item.tasks?.title || '',
        'Uploaded By': item.profiles?.full_name || '',
        'Image URL': item.image_url,
        'Created': new Date(item.created_at).toLocaleString(),
      }));

    case 'sites':
      return data.map(item => ({
        'Site ID': item.id,
        'Name': item.name,
        'Description': item.description || '',
        'Created': new Date(item.created_at).toLocaleString(),
      }));

    default:
      return data;
  }
}
