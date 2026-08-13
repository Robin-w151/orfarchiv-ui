export function adjustTables(optimizedDocument: Document): void {
  for (const table of optimizedDocument.querySelectorAll('table')) {
    adjustTable(table);
  }
}

function adjustTable(table: HTMLTableElement): void {
  const { isValid, columnHasContent, rowHasContent } = checkTableValidity(table);
  if (!isValid) {
    table.remove();
    return;
  }

  for (const { rowIndex, rowSpan, columnIndex, colSpan, tableCell } of tableIterator(table)) {
    const columnsWithContent = new Array(colSpan)
      .fill(null)
      .reduce((count, _, i) => count + (columnHasContent[columnIndex + i] ? 1 : 0), 0);

    if (columnsWithContent === 0) {
      tableCell.remove();
      continue;
    } else if (columnsWithContent < colSpan) {
      tableCell.colSpan = columnsWithContent;
    }

    const rowsWithContent = new Array(rowSpan)
      .fill(null)
      .reduce((count, _, i) => count + (rowHasContent[rowIndex + i] ? 1 : 0), 0);

    if (rowsWithContent === 0) {
      tableCell.remove();
    } else if (rowsWithContent < rowSpan) {
      tableCell.rowSpan = rowsWithContent;
    }
  }

  for (const row of [...table.rows]) {
    if (row.cells.length === 0) {
      row.remove();
    }
  }
}

function checkTableValidity(table: HTMLTableElement): {
  isValid: boolean;
  columnHasContent: Array<boolean>;
  rowHasContent: Array<boolean>;
} {
  const tableColumns = calculateTableColumns(table);
  const tableRows = table.rows.length;
  if (tableColumns === 0 || tableRows === 0) {
    return { isValid: false, columnHasContent: [], rowHasContent: [] };
  }

  const columnHasContent = new Array<boolean>(tableColumns).fill(false);
  const rowHasContent = new Array<boolean>(tableRows).fill(false);
  let isValid = true;

  for (const { rowIndex, rowSpan, columnIndex, colSpan, tableCell } of tableIterator(table)) {
    if (columnIndex + colSpan - 1 < columnHasContent.length) {
      if (tableCell.innerHTML) {
        for (let i = 0; i < colSpan; i++) {
          columnHasContent[columnIndex + i] = true;
        }
        for (let i = 0; i < rowSpan && rowIndex + i < rowHasContent.length; i++) {
          rowHasContent[rowIndex + i] = true;
        }
      }
    } else {
      isValid = false;
    }
  }

  return { isValid, columnHasContent, rowHasContent };
}

function calculateTableColumns(table: HTMLTableElement): number {
  const firstRow = table.rows[0];
  if (!firstRow) {
    return 0;
  }

  return ([...firstRow.children] as Array<HTMLTableCellElement>).reduce(
    (count, cell) => count + (cell.colSpan ?? 1),
    0,
  );
}

function* tableIterator(table: HTMLTableElement): Generator<{
  rowIndex: number;
  rowSpan: number;
  columnIndex: number;
  colSpan: number;
  tableCell: HTMLTableCellElement;
}> {
  const tableRows = table.rows.length;
  const rowSpanOffsetMap = new Map<number, Map<number, number>>(
    Array.from({ length: tableRows }, () => new Map()).map((rowMap, row) => [row, rowMap]),
  );

  for (const [tableRowIndex, tableRow] of [...table.rows].entries()) {
    let rowIndexOffset = 0;
    for (const [tableColumnIndex, tableCell] of [...tableRow.cells].entries()) {
      const colSpan = tableCell.colSpan ?? 1;
      const rowSpan = tableCell.rowSpan ?? 1;
      const additionalColumns = colSpan - 1;
      const adjustedColumnIndex = tableColumnIndex + rowIndexOffset;
      const additionalColumnsFromPreviousRowSpans =
        rowSpanOffsetMap
          .get(tableRowIndex)
          ?.entries()
          .filter(([c]) => c <= adjustedColumnIndex)
          .reduce((offset, [, span]) => offset + span, 0) ?? 0;
      const adjustedColumnIndexWithRowSpans = adjustedColumnIndex + additionalColumnsFromPreviousRowSpans;

      if (rowSpan > 1) {
        for (let i = 1; i < rowSpan; i++) {
          rowSpanOffsetMap.get(tableRowIndex + i)?.set(adjustedColumnIndexWithRowSpans, colSpan);
        }
      }

      yield {
        rowIndex: tableRowIndex,
        rowSpan,
        columnIndex: adjustedColumnIndexWithRowSpans,
        colSpan,
        tableCell,
      };

      rowIndexOffset += additionalColumns;
    }
  }
}
