import { useEffect, useMemo, useRef, useState } from 'react';

const API_PROXY_BASE = import.meta.env.VITE_API_PROXY_PATH || '/.netlify/functions/proxy';
const TIMESTAMP_COLUMN = '타임스탬프';

const PRE_FORM = {
  embed: 'https://docs.google.com/forms/d/e/1FAIpQLSeOZ6vmd6q3VrnmjTpkJ4xJTUaIJx_qhkBLdVLvS1CnHpWBOg/viewform?embedded=true',
  open: 'https://docs.google.com/forms/d/e/1FAIpQLSeOZ6vmd6q3VrnmjTpkJ4xJTUaIJx_qhkBLdVLvS1CnHpWBOg/viewform',
};

const POST_FORM = {
  embed: 'https://docs.google.com/forms/d/e/1FAIpQLSdt9GfLprmm4oTSS-7PdsxT34bx4o5UlUSz-Xi5TJb0ocQUjA/viewform?embedded=true',
  open: 'https://docs.google.com/forms/d/e/1FAIpQLSdt9GfLprmm4oTSS-7PdsxT34bx4o5UlUSz-Xi5TJb0ocQUjA/viewform',
};

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

function findColumn(headers, keyword) {
  const found = headers.find((h) => h.includes(keyword));
  return found || keyword;
}

function pickLatestMatch(rows, nameCol, studentCol, inputName, inputStudentId) {
  const matches = rows.filter((row) => {
    const rowName = String(row?.[nameCol] ?? '').trim();
    const rowStudentId = String(row?.[studentCol] ?? '').trim();
    return rowName === inputName && rowStudentId === inputStudentId;
  });

  if (!matches.length) return null;

  return [...matches].sort((a, b) => {
    const ad = parseDate(a?.[TIMESTAMP_COLUMN]);
    const bd = parseDate(b?.[TIMESTAMP_COLUMN]);
    if (!ad && !bd) return 0;
    if (!ad) return 1;
    if (!bd) return -1;
    return bd - ad;
  })[0];
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function getDeltaTone(delta) {
  if (delta > 0) return 'tone-up';
  if (delta < 0) return 'tone-down';
  return 'tone-neutral';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('result');
  const [nameInput, setNameInput] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [sortMode, setSortMode] = useState('default');

  const [preData, setPreData] = useState([]);
  const [postData, setPostData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  const [queryState, setQueryState] = useState({
    loading: false,
    error: '',
    info: '이름과 학번을 모두 입력해 주세요.',
    result: null,
  });

  const resultRef = useRef(null);

  async function fetchDataset(dataset) {
    const response = await fetch(`${API_PROXY_BASE}?dataset=${dataset}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`${dataset} 데이터 요청 실패: ${response.status}`);
    }
    const json = await response.json();
    return Array.isArray(json?.data) ? json.data : [];
  }

  async function loadBothDatasets() {
    setDataLoading(true);
    setDataError('');
    try {
      const [preRows, postRows] = await Promise.all([fetchDataset('pre'), fetchDataset('post')]);
      setPreData(preRows);
      setPostData(postRows);
      return { preRows, postRows };
    } catch (error) {
      const message = error?.message || '데이터를 불러오는 중 오류가 발생했습니다.';
      setDataError(message);
      throw error;
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    loadBothDatasets().catch(() => {});
  }, []);

  async function onSearch() {
    const cleanName = nameInput.trim();
    const cleanStudentId = studentIdInput.trim();

    if (!cleanName || !cleanStudentId) {
      setQueryState((prev) => ({
        ...prev,
        info: '이름과 학번을 모두 입력해 주세요.',
        error: '',
        result: null,
      }));
      return;
    }

    setQueryState({ loading: true, error: '', info: '', result: null });

    try {
      let preRows = preData;
      let postRows = postData;

      if (!preRows.length && !postRows.length) {
        const loaded = await loadBothDatasets();
        preRows = loaded.preRows;
        postRows = loaded.postRows;
      }

      const preHeaders = preRows[0] ? Object.keys(preRows[0]) : [];
      const postHeaders = postRows[0] ? Object.keys(postRows[0]) : [];

      const preNameCol = findColumn(preHeaders, '이름');
      const preStudentCol = findColumn(preHeaders, '학번');
      const postNameCol = findColumn(postHeaders, '이름');
      const postStudentCol = findColumn(postHeaders, '학번');

      const preMatch = pickLatestMatch(preRows, preNameCol, preStudentCol, cleanName, cleanStudentId);
      const postMatch = pickLatestMatch(postRows, postNameCol, postStudentCol, cleanName, cleanStudentId);

      if (!preMatch && !postMatch) {
        setQueryState({
          loading: false,
          error: '',
          info: '일치하는 학생 정보를 찾을 수 없습니다.',
          result: null,
        });
        return;
      }

      const preScoreColumns = preHeaders.filter(
        (h) => !h.includes('이름') && !h.includes('학번') && h !== TIMESTAMP_COLUMN && preRows.some((row) => parseScore(row[h]) !== null)
      );
      const postScoreColumns = postHeaders.filter(
        (h) => !h.includes('이름') && !h.includes('학번') && h !== TIMESTAMP_COLUMN && postRows.some((row) => parseScore(row[h]) !== null)
      );

      const commonColumns = preScoreColumns.filter((h) => postScoreColumns.includes(h));

      const rowComparisons = commonColumns
        .map((column) => {
          const pre = preMatch ? parseScore(preMatch[column]) : null;
          const post = postMatch ? parseScore(postMatch[column]) : null;
          if (pre === null && post === null) return null;
          const delta = pre !== null && post !== null ? post - pre : null;
          return { column, pre, post, delta };
        })
        .filter(Boolean);

      const comparableRows = rowComparisons.filter((row) => row.pre !== null && row.post !== null);
      const preScores = comparableRows.map((row) => row.pre);
      const postScores = comparableRows.map((row) => row.post);
      const deltas = comparableRows.map((row) => row.post - row.pre);

      const improved = deltas.filter((d) => d > 0).length;
      const worsened = deltas.filter((d) => d < 0).length;
      const same = deltas.filter((d) => d === 0).length;

      const summary = {
        questionCount: comparableRows.length,
        preAvg: average(preScores),
        postAvg: average(postScores),
        deltaAvg: comparableRows.length ? average(postScores) - average(preScores) : null,
        improved,
        worsened,
        same,
      };

      const result = {
        studentName: cleanName,
        studentId: cleanStudentId,
        preTimestamp: preMatch?.[TIMESTAMP_COLUMN] || null,
        postTimestamp: postMatch?.[TIMESTAMP_COLUMN] || null,
        rows: rowComparisons,
        summary,
      };

      let info = '';
      if (!preMatch && postMatch) info = '사전 응답이 없습니다.';
      if (preMatch && !postMatch) info = '사후 응답이 없습니다.';

      setQueryState({
        loading: false,
        error: '',
        info,
        result,
      });

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch (error) {
      setQueryState({
        loading: false,
        error: error?.message || '조회 중 오류가 발생했습니다.',
        info: '',
        result: null,
      });
    }
  }

  const sortedRows = useMemo(() => {
    const base = queryState.result?.rows || [];
    if (sortMode === 'improved') return [...base].sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999));
    if (sortMode === 'worsened') return [...base].sort((a, b) => (a.delta ?? 999) - (b.delta ?? 999));
    return base;
  }, [queryState.result, sortMode]);

  const avgChartData = useMemo(() => {
    const summary = queryState.result?.summary;
    if (!summary) return [];
    return [
      { label: '사전 평균', value: summary.preAvg ?? 0, tone: 'bar-pre' },
      { label: '사후 평균', value: summary.postAvg ?? 0, tone: 'bar-post' },
    ];
  }, [queryState.result]);

  const statusChartData = useMemo(() => {
    const summary = queryState.result?.summary;
    if (!summary) return [];
    return [
      { label: '개선', value: summary.improved, tone: 'bar-up' },
      { label: '동일', value: summary.same, tone: 'bar-neutral' },
      { label: '악화', value: summary.worsened, tone: 'bar-down' },
    ];
  }, [queryState.result]);

  return (
    <main className="page">
      <header className="header card">
        <h1>기관계 개념 진단 학생 대시보드</h1>
        <p>설문 참여와 개인 pre/post 비교 조회를 한 화면에서 제공합니다.</p>
      </header>

      <nav className="tabs" aria-label="탭 메뉴">
        <button type="button" className={`tab-btn ${activeTab === 'survey' ? 'active' : ''}`} onClick={() => setActiveTab('survey')}>
          설문 참여
        </button>
        <button type="button" className={`tab-btn ${activeTab === 'result' ? 'active' : ''}`} onClick={() => setActiveTab('result')}>
          내 결과 보기
        </button>
      </nav>

      {activeTab === 'survey' && (
        <section className="stack">
          <article className="card survey-card">
            <div className="survey-head">
              <h2>사전 설문</h2>
              <p>수업 전 개념 수준을 확인하는 사전 검사입니다.</p>
              <a href={PRE_FORM.open} target="_blank" rel="noreferrer">새 창에서 열기</a>
            </div>
            <iframe title="사전 설문" src={PRE_FORM.embed} className="survey-iframe" />
          </article>

          <article className="card survey-card">
            <div className="survey-head">
              <h2>사후 설문</h2>
              <p>수업 후 개념 변화를 확인하는 사후 검사입니다.</p>
              <a href={POST_FORM.open} target="_blank" rel="noreferrer">새 창에서 열기</a>
            </div>
            <iframe title="사후 설문" src={POST_FORM.embed} className="survey-iframe" />
          </article>
        </section>
      )}

      {activeTab === 'result' && (
        <section className="stack">
          <article className="card">
            <h2>내 결과 조회</h2>
            <p className="muted">이름과 학번을 모두 입력해 주세요.</p>
            <div
              className="search-grid"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSearch();
                }
              }}
            >
              <input type="text" placeholder="이름" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
              <input type="text" placeholder="학번" value={studentIdInput} onChange={(e) => setStudentIdInput(e.target.value)} />
              <button type="button" onClick={onSearch} disabled={queryState.loading || dataLoading}>
                {queryState.loading || dataLoading ? '조회 중...' : '조회'}
              </button>
            </div>

            {dataError && <p className="state error">데이터 로딩 오류: {dataError}</p>}
            {queryState.error && <p className="state error">오류: {queryState.error}</p>}
            {!queryState.error && !dataError && queryState.info && <p className="state info">{queryState.info}</p>}
          </article>

          {queryState.result && (
            <section ref={resultRef} className="stack">
              <article className="card">
                <h2>학생 정보</h2>
                <div className="grid grid-2">
                  <div><strong>이름</strong><div>{queryState.result.studentName}</div></div>
                  <div><strong>학번</strong><div>{queryState.result.studentId}</div></div>
                  <div><strong>사전 응답 시각</strong><div>{formatDate(parseDate(queryState.result.preTimestamp))}</div></div>
                  <div><strong>사후 응답 시각</strong><div>{formatDate(parseDate(queryState.result.postTimestamp))}</div></div>
                </div>
              </article>

              <article className="card">
                <h2>요약</h2>
                <div className="grid grid-3">
                  <div className="mini-card"><small>분석 문항 수</small><strong>{queryState.result.summary.questionCount}</strong></div>
                  <div className="mini-card"><small>사전 평균</small><strong>{queryState.result.summary.preAvg === null ? '-' : queryState.result.summary.preAvg.toFixed(2)}</strong></div>
                  <div className="mini-card"><small>사후 평균</small><strong>{queryState.result.summary.postAvg === null ? '-' : queryState.result.summary.postAvg.toFixed(2)}</strong></div>
                  <div className="mini-card"><small>평균 변화량</small><strong className={getDeltaTone(queryState.result.summary.deltaAvg ?? 0)}>{queryState.result.summary.deltaAvg === null ? '-' : queryState.result.summary.deltaAvg.toFixed(2)}</strong></div>
                  <div className="mini-card"><small>개선 문항 수</small><strong>{queryState.result.summary.improved}</strong></div>
                  <div className="mini-card"><small>악화 문항 수</small><strong>{queryState.result.summary.worsened}</strong></div>
                  <div className="mini-card"><small>동일 문항 수</small><strong>{queryState.result.summary.same}</strong></div>
                </div>
              </article>

              <section className="grid grid-2">
                <article className="card">
                  <h2>그래프 1: 사전 평균 vs 사후 평균</h2>
                  <div className="simple-chart">
                    {avgChartData.map((item) => (
                      <div key={item.label} className="chart-row">
                        <span className="chart-label">{item.label}</span>
                        <div className="chart-track"><div className={`chart-bar ${item.tone}`} style={{ width: `${(item.value / 5) * 100}%` }} /></div>
                        <span className="chart-value">{item.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="card">
                  <h2>그래프 3: 개선/동일/악화 분포</h2>
                  <div className="simple-chart">
                    {statusChartData.map((item) => {
                      const total = queryState.result.summary.questionCount || 1;
                      const width = (item.value / total) * 100;
                      return (
                        <div key={item.label} className="chart-row">
                          <span className="chart-label">{item.label}</span>
                          <div className="chart-track"><div className={`chart-bar ${item.tone}`} style={{ width: `${width}%` }} /></div>
                          <span className="chart-value">{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </section>

              <article className="card">
                <h2>그래프 2: 문항별 사전/사후 비교</h2>
                <div className="compare-scroll">
                  {sortedRows.map((row) => {
                    const preWidth = row.pre === null ? 0 : (row.pre / 5) * 100;
                    const postWidth = row.post === null ? 0 : (row.post / 5) * 100;
                    return (
                      <div key={row.column} className="question-compare-row">
                        <div className="question-name">{row.column}</div>
                        <div className="pair-bars">
                          <div className="pair"><span>Pre</span><div className="chart-track"><div className="chart-bar bar-pre" style={{ width: `${preWidth}%` }} /></div><strong>{row.pre ?? '-'}</strong></div>
                          <div className="pair"><span>Post</span><div className="chart-track"><div className="chart-bar bar-post" style={{ width: `${postWidth}%` }} /></div><strong>{row.post ?? '-'}</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="card">
                <div className="table-header">
                  <h2>문항별 비교 테이블</h2>
                  <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                    <option value="default">원래 순서</option>
                    <option value="improved">개선 큰 순</option>
                    <option value="worsened">악화 큰 순</option>
                  </select>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>문항명</th><th>사전 점수</th><th>사후 점수</th><th>변화량(Δ)</th></tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.column}>
                          <td>{row.column}</td><td>{row.pre ?? '-'}</td><td>{row.post ?? '-'}</td>
                          <td className={getDeltaTone(row.delta ?? 0)}>{row.delta === null ? '-' : `${row.delta > 0 ? '+' : ''}${row.delta}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          )}
        </section>
      )}
    </main>
  );
}
