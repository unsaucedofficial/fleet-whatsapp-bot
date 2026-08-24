function transformMotivePayload(report) {
  const driver = report.driver
    ? `${report.driver.first_name} ${report.driver.last_name}`.trim()
    : 'Unknown Driver';

  const defects = (report.defects || []).map(part => ({
    category: part.category,
    notes: part.notes || (part.type ? `${part.type} defect` : ''),
  }));

  return {
    action: 'inspection_report_upserted',
    vehicle_number: report.vehicle?.number || report.vehicle_number || 'Unknown Vehicle',
    driver_name: driver,
    inspection_type: report.inspection_type || 'inspection',
    defects,
  };
}

module.exports = { transformMotivePayload };