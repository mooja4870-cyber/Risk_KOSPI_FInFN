<<<<<<< HEAD
# Risk_KOSPI_FInFN
=======
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

## 아키텍처 및 기술 스택 (Architecture & Tech Stack)
본 프로젝트는 **React**로 구성된 프론트엔드와 **Streamlit**으로 구성된 백엔드 래퍼(Wrapper)가 결합된 하이브리드 대시보드 구조입니다.

- **Frontend**: `React`, `TypeScript`, `Vite`, `Tailwind CSS`, `Lucide React`
- **Backend/Wrapper**: `Python (Streamlit)`
- **데이터 흐름**: 시스템이 주기적으로 `public/latest-trading-data.json` 파일을 업데이트하면, Streamlit 앱(`app.py`)이 번들링된 React 정적 페이지(`index.html`)에 해당 JSON을 동적으로 주입(Injection)하여 화면에 렌더링합니다.

## 프로젝트 폴더 구조 (Directory Structure)
```
Risk_KOSPI/
├── app.py                # Streamlit 백엔드 래퍼 스크립트 (React 번들 로딩 역할)
├── package.json          # Node.js 패키지 의존성 파일
├── vite.config.ts        # Vite 빌드 설정 파일
├── public/
│   └── latest-trading-data.json  # 최신 거래 데이터 페이로드 파일
├── src/                  # React 프론트엔드 소스코드 기반
│   ├── App.tsx           # 메인 UI 레이아웃 및 탭 라우팅
│   ├── components/       # 차트, 데이터표, 리스크 점수표 등 UI 컴포넌트
│   ├── data/             # Mock-up 데이터 (mockData.ts)
│   └── utils/            # 이동평균, 연속 매도 계산 등 분석 로직 (analysis.ts)
└── dist/                 # Vite 빌드 산출물 (index.html 및 static files 등록 위치)
```

## 실행 방법 (How to Run)
1. **프론트엔드 개발 환경 실행**
   ```bash
   npm install
   npm run dev
   ```
2. **프로덕션 빌드 및 하이브리드 대시보드(Streamlit) 실행**
   ```bash
   npm run build
   streamlit run app.py
   ```
>>>>>>> aadefcc (feat: Prepare for Streamlit Cloud deployment with static assets and server management)
