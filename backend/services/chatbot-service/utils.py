def format_report_to_string(reports:list):
    """
    Convert a report dictionary to a string format.

    Args:
        report (dict): The report dictionary.

    Returns:
    formatted_report (str): The formatted report string.
    """
    formatted_reports = []
    for report in reports:
        if not isinstance(report, dict):
            raise ValueError("Report must be a dictionary")
        report_str = f"Report ID: {report.get('id')}\n"
        report_str += f"employee ID: {report.get('employeeId')}\n"
        report_str += f"Product Code: {report.get('productCode')}\n"
        report_str += f"Content: {report.get('content')}\n"
        report_str += f"Created At: {report.get('createdAt')}\n"
        formatted_reports.append(report_str)
   
    return '\n\n'.join(formatted_reports)