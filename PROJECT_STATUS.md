## 현재 진행 상태
- 요구사항: '종료일'만 현재일로 보이고 그래프/데이터는 과거 기준으로 남는 문제 수정
- 현재 단계: UI 날짜 동기화 + Streamlit 데이터 자동 갱신 fallback + 주기 재조회 반영 완료

## 2026-04-29 추가 작업
1. `src/App.tsx`
- 종료일 기본값을 `오늘`이 아닌 `min(오늘, 최신데이터일)` 기준으로 보정
- 데이터 로드 후 사용자가 과거를 선택하지 않은 경우만 종료일 자동 보정
- 5분 주기 `latest-trading-data.json` 재조회(폴링) 추가
- 최신 데이터가 오늘보다 과거일 때 안내 문구 표시

2. `streamlit_app.py`
- `public/latest-trading-data.json` 파일이 6시간 이상 stale이면 앱 로드시 `scripts/update_latest_data.py` 자동 실행(fallback)

3. 안정화
- `src/App.tsx` 내 기존 깨진 문자열/JSX 태그를 컴파일 가능 상태로 복구
- `python -m py_compile streamlit_app.py scripts/update_latest_data.py` 통과
- `npm.cmd run build` 통과

## 참고 이력
- 이전 조치로 `scripts/update_latest_data.py`의 백필 조건은 이미 수정되어 `public/latest-trading-data.json` 최신화 가능 상태였음
- 이번 조치는 "UI 종료일만 오늘로 바뀌고 실제 그래프/데이터는 과거로 남는" 연결 문제를 직접 해결하는 목적

## 2026-04-29 배포 반영 추가
- scripts/update_latest_data.py 로그 문자열을 ASCII로 교체(cp949 콘솔 예외 방지)
- 데이터 수집 재실행으로 public/latest-trading-data.json 최신일을 2026-04-29로 갱신
- Streamlit 반영을 위해 원격 푸시 진행

- streamlit_app.py fallback stale 판정을 파일 mtime에서 JSON meta.updatedAtKst 기준으로 개선(배포 직후에도 실제 데이터 노후 감지)
- App.tsx 전반의 한글 모지바케(깨진 문자열) 복구 및 UI 문구 정상화
- KOSPI 전체 백필 조건 개선: earliest_kospi_existing가 과도하게 최근이면 1회 deep backfill 수행하도록 update_latest_data.py 수정

- KOSPI 전체 백필 조건 개선: earliest_kospi_existing가 과도하게 최근이면 1회 deep backfill 수행하도록 update_latest_data.py 수정
- 백필 재실행 결과: KOSPI first_non_null=1997-06-04, 2025-01-01~2025-11-04 구간 null 0건


- 일봉/주봉/월봉 전환 추가: DailyBarChart, CorrelationChart에 해상도 토글 UI 및 집계 로직 연동
- analysis.ts에 주/월 집계 유틸(aggregateMovingAverageSeries, aggregateTradeData) 추가

- analysis.ts에 주/월 집계 유틸(aggregateMovingAverageSeries, aggregateTradeData) 추가
- 일봉/주봉/월봉 전환 추가: DailyBarChart, CorrelationChart에 해상도 토글 UI 및 집계 로직 연동

## 2026-05-01 데이터 최신화
- 사용자 보고: 4/29까지만 표시됨 → streamlit_static/latest-trading-data.json이 4/29 stale 상태 확인
- scripts/update_latest_data.py 재실행 → public/latest-trading-data.json: 1997-04-14 ~ 2026-04-30 (7242 rows)
- public → dist, streamlit_static 동기 복사 (3개 파일 updatedAtKst=2026-05-01 05:55:35, last=2026-04-30)
- 참고: 2026-05-01은 근로자의 날(한국 증시 휴장)이므로 4/30이 최신 거래일
