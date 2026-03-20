# KOSPI 거래주체별 수급 분석 (Financial Investment Flow Analyzer)

## 개요 (Overview)
본 프로젝트는 KOSPI 시장에서 기관 투자자의 한 축을 담당하는 **'금융투자(Financial Investment)'**의 일일 매매 동향(수급)을 딥스 다이브(Deep Dive)하여 분석하는 리스크 모니터링 시스템입니다. 
주로 금융투자의 대규모 순매도나 연속 매도 패턴을 추적하여 주식 시장의 급락 위험을 사전에 감지하고 예방하는 데 목적을 두고 있습니다.

## 주요 기능 (Features)
1. **연속 순매도 패턴 감지 (Streak Detection)**
   - 3일 연속 순매도: 단기 조정 가능성 증가 (주의)
   - 5일 연속 순매도: 프로그램 매도 동반 시 하락 확률 상승 (위험)
   - 7일 이상 순매도: 지수 변동성 급등 구간 진입 가능성 (고위험)
2. **리스크 스코어링 (Risk Assessment)**
   - 금융투자의 수급 상황과 코스피 지수의 이동평균선(MA) 이탈 등 여러 지표를 종합하여 실시간 리스크 점수를 산출합니다.
3. **이동평균 분석 (Moving Averages)**
   - 5일선(MA5)과 20일선(MA20)을 기준으로 단기 및 중기적인 수급 추세를 시각적으로 제공합니다.
4. **대시보드 차트화 (Visual Charts)**
   - 누적 수급 차트, 일일 막대 차트 등을 통해 외국인 수급과의 상관관계 등 복합적인 시장 반응을 직관적으로 확인할 수 있습니다.
5. **실시간 자동 업데이트 (Auto-Update Scheduler)**
   - 시간 단위 자동 갱신으로 최신 거래 데이터를 항상 반영합니다.

## 아키텍처 및 기술 스택 (Architecture & Tech Stack)
본 프로젝트는 **React**로 구성된 프론트엔드와 **Streamlit**으로 구성된 백엔드 래퍼(Wrapper)가 결합된 하이브리드 대시보드 구조입니다.

- **Frontend**: `React`, `TypeScript`, `Vite`, `Tailwind CSS`, `Lucide React`
- **Backend/Wrapper**: `Python (Streamlit)`
- **Scheduler**: `APScheduler` (시간 단위 자동 데이터 갱신)
- **데이터 흐름**: 스케줄러가 시간 단위(평일 09:00-15:30은 30분 단위)로 `public/latest-trading-data.json`을 업데이트하면, Streamlit 앱(`streamlit_app.py`)이 이 JSON을 React UI에 동적으로 주입하여 실시간으로 렌더링합니다.

## 프로젝트 폴더 구조 (Directory Structure)
```
Risk_KOSPI/
├── streamlit_app.py      # Streamlit 백엔드 래퍼 (React 정적 번들 로딩)
├── ecosystem.config.cjs  # PM2 프로세스 관리 설정
├── package.json          # Node.js 패키지 의존성
├── requirements.txt      # Python 패키지 의존성
├── vite.config.ts        # Vite 빌드 설정
├── public/
│   └── latest-trading-data.json  # 최신 거래 데이터 JSON
├── scripts/
│   ├── update_latest_data.py     # 데이터 수집 및 업데이트 스크립트
│   └── scheduler.py              # 자동 업데이트 스케줄러 (시간 단위)
├── src/                  # React 프론트엔드 소스
│   ├── App.tsx           # 메인 UI & 탭 라우팅
│   ├── components/       # UI 컴포넌트 (차트, 테이블, 리스크 점수 등)
│   ├── data/             # Mock 데이터
│   └── utils/            # 분석 로직
├── dist/                 # Vite 프로덕션 빌드 산출물
└── streamlit_static/     # Streamlit 배포용 정적 파일
```

## 설치 및 실행 (Installation & Execution)

### 1️⃣ 초기 설정
```bash
# Node.js 패키지 설치
npm install

# Python 의존성 설치
pip install -r requirements.txt
```

### 2️⃣ 개발 모드 실행
```bash
# 프론트엔드 개발 서버 실행 (Vite, Port 5173)
npm run dev

# 별도 터미널에서 Streamlit 실행
streamlit run streamlit_app.py
```

### 3️⃣ 프로덕션 모드 (자동 업데이트 포함)
```bash
# React 프로덕션 빌드
npm run build

# PM2로 모든 프로세스 자동 실행
npm start
# (스케줄러 + Streamlit 백엔드가 자동으로 시작됨)

# 프로세스 상태 확인
npx pm2 status

# 프로세스 종료
npm stop
```

### 4️⃣ 데이터 수동 업데이트
```bash
# 즉시 한 번 데이터 업데이트
npm run update:data
```

## 자동 업데이트 스케줄 (Auto-Update Schedule)
- **평일 09:00 ~ 15:30**: 30분 단위 업데이트 (시장 시간)
- **시장 외 시간 (16:00 ~ 08:59)**: 시간 단위 업데이트
- **주말**: 업데이트 안 함 (시장 휴장)
