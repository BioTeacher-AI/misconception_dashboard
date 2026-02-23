import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_GFORM_API_URL;
const TIMESTAMP_COLUMN = '타임스탬프';

function parseScore(value) {
  if (value === null || value === undefined) return null;
  const match = String(value).match(/[0-5]/);
  if (!match) return null;
  const num = Number(match[0]);
  return Number.isInteger(num) && num >= 0 && num <= 5 ? num : null;
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export default function App() {
  const [payload, setPayload] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!API_URL) {
        setError('VITE_GFORM_API_URL 환경변수가 설정되지 않았습니다.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch(API_URL, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const json = await response.json();
        const rows = Array.isArray(json?.data) ? json.data : [];

        setPayload({
          updatedAt: json?.updatedAt ?? null,
          count: Number(json?.count ?? rows.length),
          data: rows,
        });
      } catch (err) {
        setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const headers = useMemo(() => {
    if (!payload?.data?.length) return [];
    return Object.keys(payload.data[0]);
  }, [payload]);

  const scoreColumns = useMemo(() => {
    if (!payload?.data?.length) return [];

    return headers.filter((header) => {
      if (header === TIMESTAMP_COLUMN) return false;
      return payload.data.some((row) => parseScore(row[header]) !== null);
    });
  }, [headers, payload]);

  useEffect(() => {
    if (!payload) return;

    const preferSatisfaction = scoreColumns.find((col) => col.includes('만족'));
    const timestampIndex = headers.findIndex((h) => h === TIMESTAMP_COLUMN);
    const secondColumn = timestampIndex >= 0 ? headers[timestampIndex + 1] : headers[1];

    const defaultColumn = preferSatisfaction
      || (scoreColumns.includes(secondColumn) ? secondColumn : '')
      || scoreColumns[0]
      || '';

    setSelectedQuestion(defaultColumn);
  }, [payload, headers, scoreColumns]);

  const latestSubmittedAt = useMemo(() => {
    if (!payload?.data?.length) return null;

    const latest = payload.data
      .map((row) => parseDate(row[TIMESTAMP_COLUMN]))
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    return latest || null;
  }, [payload]);

  const questionScores = useMemo(() => {
    if (!selectedQuestion || !payload?.data?.length) return [];
    return payload.data
      .map((row) => parseScore(row[selectedQuestion]))
      .filter((num) => num !== null);
  }, [payload, selectedQuestion]);

  const distribution = useMemo(() => {
    const initial = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    questionScores.forEach((score) => {
      initial[score] += 1;
    });
    return initial;
  }, [questionScores]);

  const summary = useMemo(() => {
    const total = questionScores.length;
    const low = questionScores.filter((n) => n <= 2).length;
    const high = questionScores.filter((n) => n >= 3).length;
    const avg = total ? questionScores.reduce((sum, n) => sum + n, 0) / total : null;
    const med = median(questionScores);

    return { total, low, high, avg, med };
  }, [questionScores]);

  const recentRows = useMemo(() => {
    if (!payload?.data?.length) return [];

    return [...payload.data]
      .sort((a, b) => {
        const ad = parseDate(a[TIMESTAMP_COLUMN]);
        const bd = parseDate(b[TIMESTAMP_COLUMN]);
        if (!ad && !bd) return 0;
        if (!ad) return 1;
        if (!bd) return -1;
        return bd - ad;
      })
      .slice(0, 20);
  }, [payload]);

  const tableColumns = useMemo(() => {
    if (!headers.length) return [];

    const withoutTimestamp = headers.filter((h) => h !== TIMESTAMP_COLUMN);
    return [TIMESTAMP_COLUMN, ...withoutTimestamp].filter(Boolean).slice(0, 6);
  }, [headers]);

  if (loading) {
    return <main className="page"><p className="state">데이터를 불러오는 중입니다...</p></main>;
  }

  if (error) {
    return <main className="page"><p className="state error">오류: {error}</p></main>;
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Google Form 설문 대시보드</h1>
        <p>Google Apps Script JSON API를 기반으로 실시간 집계를 표시합니다.</p>
      </header>

      <section className="grid grid-3">
        <article className="card">
          <h2>총 응답 수</h2>
          <div className="value">{payload?.count ?? 0}</div>
        </article>
        <article className="card">
          <h2>updatedAt</h2>
          <div className="value small">{payload?.updatedAt || '-'}</div>
        </article>
        <article className="card">
          <h2>최근 제출 시각</h2>
          <div className="value small">{formatDate(latestSubmittedAt)}</div>
        </article>
      </section>

      <section className="card">
        <label htmlFor="question-select" className="label">문항 선택 (0~5 척도)</label>
        <select
          id="question-select"
          value={selectedQuestion}
          onChange={(e) => setSelectedQuestion(e.target.value)}
          disabled={!scoreColumns.length}
        >
          {!scoreColumns.length && <option>선택 가능한 문항 없음</option>}
          {scoreColumns.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>확신도 요약</h2>
          <p>유효 응답 {summary.total}개 기준</p>
          <ul className="summary-list">
            <li>
              낮은 확신 (0~2): <strong>{summary.low}</strong>
              <span>{summary.total ? ` (${((summary.low / summary.total) * 100).toFixed(1)}%)` : ' (-)'}</span>
            </li>
            <li>
              높은 확신 (3~5): <strong>{summary.high}</strong>
              <span>{summary.total ? ` (${((summary.high / summary.total) * 100).toFixed(1)}%)` : ' (-)'}</span>
            </li>
            <li>평균: <strong>{summary.avg === null ? '-' : summary.avg.toFixed(2)}</strong></li>
            <li>중앙값: <strong>{summary.med === null ? '-' : summary.med}</strong></li>
          </ul>
        </article>

        <article className="card">
          <h2>0~5 분포</h2>
          <div className="bars">
            {Object.entries(distribution).map(([score, count]) => {
              const maxCount = Math.max(...Object.values(distribution), 1);
              const width = (count / maxCount) * 100;
              return (
                <div key={score} className="bar-row">
                  <span className="score">{score}</span>
                  <div className="track">
                    <div className="fill" style={{ width: `${width}%` }} />
                  </div>
                  <span className="count">{count}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="card">
        <h2>최근 20개 응답</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {tableColumns.map((col) => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {recentRows.map((row, idx) => (
                <tr key={idx}>
                  {tableColumns.map((col) => (
                    <td key={col}>
                      {col === TIMESTAMP_COLUMN
                        ? formatDate(parseDate(row[col]))
                        : (row[col] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
