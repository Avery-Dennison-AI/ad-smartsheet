import apiClient from './apiClient';
import type { Column, GridRow, CellFormatting } from '../types';

export function getGrid(sheetId: string) {
  return apiClient.get(`/api/sheets/${sheetId}/grid`);
}

export function addColumn(
  sheetId: string,
  data: { name: string; type: string; position?: number; options?: { label: string; color: string }[] },
) {
  return apiClient.post(`/api/sheets/${sheetId}/grid/columns`, data);
}

export function updateColumn(
  sheetId: string,
  columnId: string,
  data: { name?: string; type?: string; options?: { label: string; color: string }[] },
) {
  return apiClient.patch(`/api/sheets/${sheetId}/grid/columns/${columnId}`, data);
}

export function deleteColumn(sheetId: string, columnId: string) {
  return apiClient.delete(`/api/sheets/${sheetId}/grid/columns/${columnId}`);
}

export function reorderColumns(sheetId: string, orderedIds: string[]) {
  return apiClient.patch(`/api/sheets/${sheetId}/grid/columns/reorder`, { orderedIds });
}

export function setPrimaryColumn(sheetId: string, columnId: string) {
  return apiClient.patch(`/api/sheets/${sheetId}/grid/columns/${columnId}/set-primary`);
}

export function addRow(sheetId: string, data?: { afterRowId?: string; cells?: Record<string, unknown> }) {
  return apiClient.post(`/api/sheets/${sheetId}/grid/rows`, data || {});
}

export function updateCell(sheetId: string, rowId: string, columnId: string, value: unknown) {
  return apiClient.patch(`/api/sheets/${sheetId}/grid/rows/${rowId}/cells/${columnId}`, { value });
}

export function deleteRows(sheetId: string, rowIds: string[]) {
  return apiClient.delete(`/api/sheets/${sheetId}/grid/rows`, { data: { rowIds } });
}

export function reorderRows(sheetId: string, orderedIds: string[]) {
  return apiClient.patch(`/api/sheets/${sheetId}/grid/rows/reorder`, { orderedIds });
}

export function updateFormatting(
  sheetId: string,
  cells: Array<{ rowId: string; columnId: string; formatting: CellFormatting | null }>,
) {
  return apiClient.patch(`/api/sheets/${sheetId}/grid/formatting`, { cells });
}

export function updateColumnFormatting(
  sheetId: string,
  columns: Array<{ columnId: string; formatting: CellFormatting | null }>,
  cascadePatch?: CellFormatting,
) {
  return apiClient.patch(`/api/sheets/${sheetId}/grid/column-formatting`, { columns, cascadePatch });
}
