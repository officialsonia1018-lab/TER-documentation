import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database as DatabaseIcon,
  HardDrive,
  PencilLine,
  Play,
  RefreshCw,
  Table2,
  Terminal,
} from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { useModules } from '../context/ModuleContext.jsx';
import {
  fetchDatabaseOverview,
  fetchTableRows,
  runSqlQuery,
  saveTableRow,
} from '../services/api.js';

// Admin-only database browser, similar to phpMyAdmin:
// table list, paginated row browsing, row editing and a read-only SQL console.

const PAGE_SIZE = 25;
const DEFAULT_SQL = 'SELECT id, title, category, position\nFROM modules\nORDER BY position;';
const NULLABLE_COLUMNS = ['live_url', 'image', 'image_placeholder'];

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return '-';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function cellText(value, column) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' && column?.json) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.length ? parsed.join(' • ') : '[]';
      }
    } catch {
      return value;
    }
  }
  return String(value);
}

function prettyJson(value) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function ResultTable({ columns, rows }) {
  if (!columns || columns.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-max text-left text-xs">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-3 text-slate-500">
                No rows returned.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="bg-white">
                {columns.map((column) => {
                  const value = row[column];
                  return (
                    <td key={column} className="max-w-xs truncate px-3 py-1.5 font-mono text-slate-700" title={value === null ? 'NULL' : String(value)}>
                      {value === null ? <span className="italic text-slate-400">NULL</span> : String(value)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Database() {
  const { showToast, refreshModules } = useModules();

  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const [activeTable, setActiveTable] = useState('modules');
  const [tableData, setTableData] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState('browse');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const [sqlText, setSqlText] = useState(DEFAULT_SQL);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState('');
  const [queryRunning, setQueryRunning] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const data = await fetchDatabaseOverview();
      setOverview(data);
      setOverviewError('');
    } catch (error) {
      setOverviewError(error.message || 'Could not load database information.');
    }
  }, []);

  const loadTable = useCallback(async (table, nextOffset) => {
    setTableLoading(true);
    setTableError('');
    try {
      const data = await fetchTableRows(table, { limit: PAGE_SIZE, offset: nextOffset });
      setTableData(data);
    } catch (error) {
      setTableError(error.message || 'Could not load the table.');
      setTableData(null);
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadTable(activeTable, offset);
  }, [activeTable, offset, loadTable]);

  const selectTable = (name) => {
    setActiveTable(name);
    setOffset(0);
    setTab('browse');
    setEditing(null);
  };

  const refreshAll = () => {
    loadOverview();
    loadTable(activeTable, offset);
  };

  const openEdit = (row) => {
    if (!tableData) {
      return;
    }
    const editableColumns = tableData.columns.filter((column) => column.editable);
    if (editableColumns.length === 0) {
      return;
    }
    const values = {};
    for (const column of editableColumns) {
      const raw = row[column.name];
      values[column.name] = raw === null ? '' : column.json ? prettyJson(raw) : String(raw);
    }
    setEditing({ row, table: tableData.table, pk: tableData.pk, columns: editableColumns });
    setForm(values);
    setEditError('');
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editing || saving) {
      return;
    }

    const changes = {};
    for (const column of editing.columns) {
      const value = form[column.name] ?? '';
      if (column.json) {
        try {
          const parsed = JSON.parse(value || '[]');
          if (!Array.isArray(parsed)) {
            throw new Error('not an array');
          }
          changes[column.name] = parsed.map((item) => String(item));
        } catch {
          setEditError(
            `${column.name} must be a JSON array of strings, for example ["First point", "Second point"].`
          );
          return;
        }
      } else if (!String(value).trim() && NULLABLE_COLUMNS.includes(column.name)) {
        changes[column.name] = null;
      } else {
        changes[column.name] = value;
      }
    }

    setSaving(true);
    setEditError('');
    try {
      await saveTableRow(editing.table, editing.row[editing.pk], changes);
      setEditing(null);
      await loadTable(activeTable, offset);
      if (editing.table === 'modules' || editing.table === 'module_sections') {
        try {
          await refreshModules();
        } catch {
          // The database write succeeded; the portal refreshes on the next load.
        }
      }
      showToast('Row saved to the database.', 'success');
    } catch (error) {
      if (error.status === 401) {
        setEditError('Admin session expired - sign in again at /login.');
      } else {
        setEditError(error.message || 'Could not save the row.');
      }
    } finally {
      setSaving(false);
    }
  };

  const executeQuery = async () => {
    if (queryRunning) {
      return;
    }
    setQueryRunning(true);
    setQueryError('');
    try {
      const result = await runSqlQuery(sqlText);
      setQueryResult(result);
    } catch (error) {
      setQueryResult(null);
      setQueryError(error.message || 'The query failed.');
    } finally {
      setQueryRunning(false);
    }
  };

  const pageStart = tableData ? tableData.offset + 1 : 0;
  const pageEnd = tableData ? Math.min(tableData.offset + tableData.rows.length, tableData.total) : 0;
  const canGoBack = offset > 0;
  const canGoForward = tableData ? offset + PAGE_SIZE < tableData.total : false;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <DatabaseIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Database</h1>
            <p className="text-sm text-slate-500">
              Browse and edit the MariaDB / MySQL tables behind the portal - admin only.
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </header>

      {overviewError ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {overviewError}
            <span className="mt-1 block text-xs">
              Start the portal server with <code className="rounded bg-amber-100 px-1">npm run server</code> and
              sign in again if your admin session expired.
            </span>
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Tables
            </p>
            <div className="space-y-1">
              {(overview?.tables || []).map((table) => (
                <button
                  key={table.name}
                  type="button"
                  onClick={() => selectTable(table.name)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    activeTable === table.name
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Table2 className="h-4 w-4" aria-hidden="true" />
                    <span className="font-mono text-xs">{table.name}</span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      activeTable === table.name ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {table.rows}
                  </span>
                </button>
              ))}
              {!overview && !overviewError ? (
                <p className="px-3 py-2 text-xs text-slate-400">Loading tables...</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <HardDrive className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Storage
            </p>
            {overview ? (
              <dl className="mt-2 space-y-1.5 text-slate-500">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Database</dt>
                  <dd className="break-all font-mono text-[11px] text-slate-600">
                    {overview.database.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Server</dt>
                  <dd className="font-medium text-slate-700">
                    {overview.database.host}:{overview.database.port}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Size</dt>
                  <dd className="font-medium text-slate-700">{formatBytes(overview.database.bytes)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Section images</dt>
                  <dd className="font-medium text-slate-700">{overview.uploads.count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Stored in</dt>
                  <dd className="font-medium text-slate-700">
                    {overview.uploads.database} in database
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-slate-400">No connection to the portal server.</p>
            )}
            <p className="mt-3 border-t border-slate-100 pt-2 leading-relaxed text-slate-400">
              Changes made here are written straight to the database and show up on the portal
              immediately. You can also open the same database in phpMyAdmin.
            </p>
          </div>
        </aside>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setTab('browse')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === 'browse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                Browse
              </button>
              <button
                type="button"
                onClick={() => setTab('sql')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === 'sql' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                SQL console
              </button>
            </div>

            {tab === 'browse' && tableData ? (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  {tableData.total === 0 ? '0 rows' : `${pageStart}-${pageEnd} of ${tableData.total} rows`}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={!canGoBack || tableLoading}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={!canGoForward || tableLoading}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>

          {tab === 'browse' ? (
            <div className="mt-4">
              {tableError ? (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {tableError}
                </p>
              ) : null}

              {tableLoading ? (
                <p className="py-6 text-center text-xs text-slate-400">Loading rows...</p>
              ) : tableData ? (
                <>
                  <p className="mb-2 font-mono text-xs text-slate-400">
                    {tableData.table}
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5">
                      primary key: {tableData.pk}
                    </span>
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-max text-left text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          {tableData.columns.map((column) => (
                            <th
                              key={column.name}
                              className="whitespace-nowrap border-b border-slate-200 px-3 py-2 align-bottom"
                            >
                              <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                                {column.name}
                                {column.pk ? (
                                  <span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">
                                    PK
                                  </span>
                                ) : null}
                              </span>
                              <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-400">
                                {column.type || 'ANY'}
                                {column.json ? ' · JSON' : ''}
                              </span>
                            </th>
                          ))}
                          <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold text-slate-600">
                            Row
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tableData.rows.length === 0 ? (
                          <tr>
                            <td colSpan={tableData.columns.length + 1} className="px-3 py-4 text-center text-slate-400">
                              This table is empty.
                            </td>
                          </tr>
                        ) : (
                          tableData.rows.map((row) => (
                            <tr key={String(row[tableData.pk])} className="bg-white hover:bg-slate-50/60">
                              {tableData.columns.map((column) => {
                                const text = cellText(row[column.name], column);
                                return (
                                  <td
                                    key={column.name}
                                    className="max-w-[24rem] truncate px-3 py-1.5 font-mono text-slate-700"
                                    title={text === null ? 'NULL' : text}
                                  >
                                    {text === null ? (
                                      <span className="italic text-slate-400">NULL</span>
                                    ) : (
                                      text
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-1.5 text-right">
                                {tableData.columns.some((column) => column.editable) ? (
                                  <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                                    <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                                    Edit
                                  </Button>
                                ) : (
                                  <span className="text-[11px] text-slate-400">read-only</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="mt-4">
              <label htmlFor="sql-query" className="text-xs font-medium text-slate-600">
                SQL query (read-only: SELECT / WITH only)
              </label>
              <textarea
                id="sql-query"
                rows={6}
                value={sqlText}
                onChange={(event) => setSqlText(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    executeQuery();
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                spellCheck={false}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-400">
                  Ctrl + Enter runs the query. Writes are blocked - edit rows in Browse.
                </p>
                <Button size="sm" onClick={executeQuery} disabled={queryRunning}>
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  {queryRunning ? 'Running...' : 'Run query'}
                </Button>
              </div>

              {queryError ? (
                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {queryError}
                </p>
              ) : null}

              {queryResult ? (
                <div className="mt-3">
                  <p className="text-xs text-slate-500">
                    {queryResult.total} row{queryResult.total === 1 ? '' : 's'} returned
                    {queryResult.truncated ? ' (showing the first 500)' : ''}
                  </p>
                  <ResultTable columns={queryResult.columns} rows={queryResult.rows} />
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {editing ? (
        <Modal title={`Edit row in ${editing.table}`} onClose={() => setEditing(null)} maxWidth="max-w-3xl">
          <form onSubmit={saveEdit} className="space-y-3">
            <p className="text-xs text-slate-500">
              {editing.pk}: <span className="font-mono text-slate-700">{String(editing.row[editing.pk])}</span>
            </p>

            {editError ? (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {editError}
              </p>
            ) : null}

            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {editing.columns.map((column) => (
                <div key={column.name} className="flex flex-col gap-1">
                  <label htmlFor={`db-field-${column.name}`} className="text-xs font-medium text-slate-600">
                    <span className="font-mono">{column.name}</span>
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">
                      {column.type || 'ANY'}
                      {column.json ? ' · JSON array' : ''}
                    </span>
                  </label>
                  {column.json || column.name === 'summary' || column.name === 'purpose' || column.name === 'example' ? (
                    <textarea
                      id={`db-field-${column.name}`}
                      rows={column.json ? 4 : 3}
                      value={form[column.name] ?? ''}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, [column.name]: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                      spellCheck={false}
                    />
                  ) : (
                    <input
                      id={`db-field-${column.name}`}
                      type={column.name === 'position' ? 'number' : 'text'}
                      min={column.name === 'position' ? 0 : undefined}
                      value={form[column.name] ?? ''}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, [column.name]: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save row'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
