import { useMemo } from 'react';
import { barY, defineChart } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react/tooltip';
import { scaleBand, scaleLinear } from 'd3-scale';
import { FaSpinner } from 'react-icons/fa6';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AdminEmptyState } from '../AdminUi';
import { AdminPanel, formatNumber } from './AdminManagementShared';

export function useServerSearch(value, wait = 300) {
    return useDebouncedValue(value, { wait }, (state) => ({ isPending: state.isPending }));
}

export function ServerSearch({ value, onChange, pending, placeholder = 'Datensätze durchsuchen …' }) {
    return (
        <label className="relative block w-full min-w-[250px]">
            <span className="sr-only">Serverseitig suchen</span>
            <input
                className="h-11 w-full rounded-xl border border-white/[.075] bg-[#0b0c10] px-4 pr-10 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-orange-400/35"
                maxLength={100}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                type="search"
                value={value}
            />
            {pending && (
                <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-xs text-orange-300" />
            )}
        </label>
    );
}

export function SnapshotChart({ title = 'Verteilung', description, rows }) {
    const usable = rows.filter((row) => Number(row.value) > 0);
    const definition = useMemo(
        () =>
            usable.length
                ? defineChart({
                      marks: [
                          barY(usable, {
                              id: `social-${title.replace(/\W/g, '-').toLowerCase()}`,
                              x: 'label',
                              y: 'value',
                              fill: '#ff721b',
                              cornerRadius: 7
                          })
                      ],
                      scales: {
                          x: { scale: () => scaleBand().padding(0.34), axis: { label: '' } },
                          y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Anzahl' } }
                      },
                      clip: true,
                      theme: {
                          foreground: '#d4d4d8',
                          muted: '#5f6069',
                          grid: '#272931',
                          background: 'transparent',
                          palette: ['#ff721b']
                      }
                  })
                : null,
        [title, usable]
    );
    return (
        <AdminPanel description={description} eyebrow="LIVE-VERTEILUNG" title={title}>
            {definition ? (
                <div className="px-3 pb-5 pt-6 text-zinc-300 sm:px-5">
                    <Chart ariaLabel={title} definition={definition} height={260} />
                </div>
            ) : (
                <div className="p-6">
                    <AdminEmptyState
                        title="Noch keine Verteilung"
                        text="Sobald Datensätze vorhanden sind, wird die Grafik automatisch aufgebaut."
                    />
                </div>
            )}
        </AdminPanel>
    );
}

export function UserRef({ value }) {
    return (
        <div className="min-w-0">
            <b className="block truncate text-xs text-zinc-200">{value?.username || 'Unaufgelöster Benutzer'}</b>
            <span className="block truncate font-mono text-[9px] text-zinc-600">{value?.userId || '—'}</span>
        </div>
    );
}

export function pageTotal(data) {
    return Number(data?.totalElements ?? data?.total ?? 0);
}
export function pageRows(data) {
    return data?.items || [];
}
export function metric(value) {
    return Number.isFinite(Number(value)) ? formatNumber(value) : '—';
}
export function humanize(value) {
    return String(value || 'Unbekannt')
        .replaceAll('_', ' ')
        .toLocaleLowerCase('de-DE')
        .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}
