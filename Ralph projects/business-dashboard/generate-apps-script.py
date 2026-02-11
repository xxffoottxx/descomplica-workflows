"""
Generates a Google Apps Script file with all test data embedded.
The user pastes this into Extensions > Apps Script in their Google Sheet and runs it.
No external API credentials needed.
"""

import csv
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "test-data")
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "test-data", "import-data.gs")


def read_csv_as_list(filename):
    """Read CSV and return list of lists (header + rows)."""
    filepath = os.path.join(DATA_DIR, filename)
    rows = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append(row)
    return rows


def generate_apps_script():
    sheets_data = {
        "Vendas": read_csv_as_list("vendas.csv"),
        "Tarefas": read_csv_as_list("tarefas.csv"),
        "Stock": read_csv_as_list("stock.csv"),
        "Equipa": read_csv_as_list("equipa.csv"),
        "Email Metrics": read_csv_as_list("email_metrics.csv"),
    }

    # Build the Apps Script
    script_parts = []
    script_parts.append("""/**
 * Import test data for Ralph's Hardware Store Dashboard.
 *
 * HOW TO USE:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code in the editor
 * 4. Paste this entire script
 * 5. Click the Save icon (or Ctrl+S)
 * 6. Select "importAllData" from the function dropdown (top bar)
 * 7. Click Run (play button)
 * 8. On first run, authorize the script when prompted
 * 9. Wait for completion - check your sheets!
 */

function importAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetsConfig = [
    { name: "Vendas", data: getVendasData() },
    { name: "Tarefas", data: getTarefasData() },
    { name: "Stock", data: getStockData() },
    { name: "Equipa", data: getEquipaData() },
    { name: "Email Metrics", data: getEmailData() },
  ];

  for (const config of sheetsConfig) {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
    } else {
      sheet.clear();
    }

    if (config.data.length > 0) {
      const numRows = config.data.length;
      const numCols = config.data[0].length;
      sheet.getRange(1, 1, numRows, numCols).setValues(config.data);

      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, numCols);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4285f4");
      headerRange.setFontColor("#ffffff");

      // Auto-resize columns
      for (let i = 1; i <= numCols; i++) {
        sheet.autoResizeColumn(i);
      }
    }

    Logger.log("Imported " + (config.data.length - 1) + " rows into " + config.name);
  }

  // Delete default Sheet1 if it exists and is empty
  const sheet1 = ss.getSheetByName("Sheet1") || ss.getSheetByName("Folha1");
  if (sheet1 && sheet1.getLastRow() === 0) {
    ss.deleteSheet(sheet1);
  }

  SpreadsheetApp.getUi().alert(
    "Import Complete!\\n\\n" +
    "Vendas: " + (getVendasData().length - 1) + " orders\\n" +
    "Tarefas: " + (getTarefasData().length - 1) + " tasks\\n" +
    "Stock: " + (getStockData().length - 1) + " products\\n" +
    "Equipa: " + (getEquipaData().length - 1) + " attendance records\\n" +
    "Email Metrics: " + (getEmailData().length - 1) + " daily records"
  );
}
""")

    # Generate data functions - split large datasets into chunks to avoid Apps Script limits
    for sheet_name, data in sheets_data.items():
        func_name = {
            "Vendas": "getVendasData",
            "Tarefas": "getTarefasData",
            "Stock": "getStockData",
            "Equipa": "getEquipaData",
            "Email Metrics": "getEmailData",
        }[sheet_name]

        # For large datasets, split into chunks
        CHUNK_SIZE = 200
        if len(data) > CHUNK_SIZE + 1:  # +1 for header
            # Create main function that concatenates chunks
            header = data[0]
            rows = data[1:]
            chunks = [rows[i:i + CHUNK_SIZE] for i in range(0, len(rows), CHUNK_SIZE)]

            script_parts.append(f"\nfunction {func_name}() {{")
            script_parts.append(f"  const header = {json.dumps(header, ensure_ascii=False)};")
            script_parts.append(f"  let rows = [];")
            for i in range(len(chunks)):
                script_parts.append(f"  rows = rows.concat({func_name}_chunk{i}());")
            script_parts.append(f"  return [header].concat(rows);")
            script_parts.append("}")

            for i, chunk in enumerate(chunks):
                script_parts.append(f"\nfunction {func_name}_chunk{i}() {{")
                script_parts.append(f"  return {json.dumps(chunk, ensure_ascii=False)};")
                script_parts.append("}")
        else:
            script_parts.append(f"\nfunction {func_name}() {{")
            script_parts.append(f"  return {json.dumps(data, ensure_ascii=False)};")
            script_parts.append("}")

    script = "\n".join(script_parts)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(script)

    # Report size
    size_kb = len(script.encode("utf-8")) / 1024
    print(f"Generated Apps Script: {OUTPUT_FILE}")
    print(f"File size: {size_kb:.1f} KB")
    print()
    for name, data in sheets_data.items():
        print(f"  {name}: {len(data) - 1} rows")


if __name__ == "__main__":
    generate_apps_script()
