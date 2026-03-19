# 💻 윈도우(Windows) 환경에서 Risk_KOSPI 똑같이 구현하기 가이드

현재 Mac에서 정상 동작 중인 **KOSPI 거래주체별 수급 분석 앱(Risk_KOSPI)**을 윈도우(Windows) PC에서 완전히 똑같이 구현하기 위한 A to Z 가이드북입니다. 기초 환경 세팅부터 실행까지 따라오기만 하면 완벽히 똑같은 대시보드를 띄울 수 있도록 중학생들도 이해하기 쉽게 작성했습니다.

---

## 🚀 0단계: 기본 필수 프로그램 설치 (Prerequisites)
가장 먼저, 윈도우 PC에 코딩의 뼈대가 되는 세 가지 필수 프로그램을 설치해야 합니다.

1. **Node.js 설치 (프론트엔드 구동용)**
   - [Node.js 공식 홈페이지](https://nodejs.org/ko/)에 접속하여 가급적 추천하는 **LTS(안정화)** 버전을 다운로드하고, 클릭만으로 설치를 완료합니다.
2. **Python 설치 (백엔드 및 Streamlit 구동용)**
   - [Python 공식 홈페이지](https://www.python.org/downloads/)에서 설치 파일을 다운로드합니다.
   - ⚠️ **매우 중요 주의사항**: 설치 시 첫 화면 하단에 있는 **`[Add Python.exe to PATH]`** 옵션을 **반드시 체크**하고 설치를 진행해야 합니다.
3. **VS Code (Visual Studio Code) 언어 편집기 설치**
   - 코드를 편리하게 보고 수정하기 위해 [VS Code](https://code.visualstudio.com/)를 설치합니다.

---

## 🛠 1단계: 똑같은 모양의 폴더와 프론트엔드 뼈대 만들기
이 앱은 **React + Vite** 기술로 화면(프론트엔드)을 그리고 있습니다. 

1. 윈도우에서 시작 버튼을 누르고 **`명령 프롬프트(cmd)`** 혹은 **`PowerShell`**을 실행합니다.
2. 프로젝트를 만들고 싶은 폴더로 이동한 뒤, 아래 명령어를 차례대로 입력해 똑같은 뼈대를 생성합니다.
   ```bash
   # 예: 바탕화면에 만들기
   cd Desktop
   
   # Risk_KOSPI라는 이름의 React(TypeScript) 프로젝트 자동 생성
   npm create vite@latest Risk_KOSPI -- --template react-ts
   
   # 만들어진 공간으로 들어가기
   cd Risk_KOSPI
   ```

3. **필수 라이브러리 설치하기**
   - 차트와 예쁜 디자인을 그리기 위한 도구들을 설치합니다.
   ```bash
   # React 전용 기초 패키지 설치
   npm install
   
   # 필수 디자인 아이콘과 차트 등 추가 라이브러리 설치
   npm install lucide-react recharts clsx tailwind-merge
   
   # 예쁜 CSS 기술인 Tailwind CSS 및 단일 파일 빌드용 도구 설치 (개발자용)
   npm install -D tailwindcss @tailwindcss/vite vite-plugin-singlefile
   ```

---

## 🛠 2단계: 핵심 소스코드 파일 복사해오기 (Mac → Windows)
기존 맥북(Mac)에 있는 파일들을 USB나 구글드라이브를 이용해 윈도우 PC의 `Risk_KOSPI` 폴더 안으로 덮어쓰기 복사해야 합니다. 
핵심 파일과 디렉터리는 다음과 같습니다.

1. **`src/` 폴더 전체 복사**
   - `App.tsx`, `components/`, `data/`, `utils/` 등 모든 프론트엔드 소스코드가 담겨있습니다. 기존 프로젝트의 `src` 폴더를 윈도우 PC의 `src` 폴더에 그대로 덮어씁니다.
2. **`public/latest-trading-data.json` 복사**
   - 시장 데이터의 근원이 되는 Mock/실시간 데이터 파일입니다.
   - `public` 폴더 안에 복사해 넣습니다.
3. **`scripts/` 폴더 복사**
   - 데이터를 수집하는 파이썬 스크립트(`update_latest_data.py`)가 들어있습니다.
4. **`vite.config.ts` 복사**
   - 단일 정적 웹페이지(Single HTML)로 빌드하기 위해 설정된 파일을 그대로 가져옵니다.

---

## 🐍 3단계: 파이썬(Python) 백엔드 세팅 및 데이터 수집
이제 만들어진 화면(UI)을 웹 페이지 앱 형태로 포장해 보여주는 **Streamlit 백엔드**를 세팅할 차례입니다.

1. VS Code 또는 빈 화면에서 터미널을 열고 뼈대 앱 폴더(`Risk_KOSPI`)에서 **가상 환경**을 만듭니다.
   ```bash
   # 가상 환경 'venv' 생성 (윈도우는 python3 대신 python을 사용합니다)
   python -m venv venv
   
   # 윈도우용 가상 환경 활성화
   venv\Scripts\activate
   ```

2. **필수 패키지 설치**
   ```bash
   pip install streamlit requests beautifulsoup4
   ```

3. **데이터 최신화 (네이버 증권 데이터 가져오기)**
   - 윈도우에서는 `python3`가 아니라 `python` 명령어를 사용해야 경로 오류가 나지 않습니다.
   ```bash
   python scripts/update_latest_data.py
   ```

---

## 🎆 4단계: 합체 및 최종 실행 (Build & Run)
자, 이제 프론트엔드를 찍어내고 백엔드로 쏴 올리기만 하면 됩니다. 윈도우에서는 명령어 문법이 약간 다릅니다.

1. **프론트엔드 빌드**
   ```bash
   npm run build
   ```

2. **파일 복사 (윈도우 전용)**
   - 맥(Mac)에서는 `cp`를 쓰지만, 윈도우 명령 프롬프트에서는 `copy`를 써야 합니다.
   - 혹시 `streamlit_static` 폴더가 없다면 먼저 만들어주세요.
   ```bash
   mkdir streamlit_static
   copy dist\index.html streamlit_static\index.html
   ```

3. **최종 윈도우 실행 (Streamlit App 구동)**
   ```bash
   # 주의: 반드시 가상환경(venv)이 활성화된 상태여야 합니다.
   streamlit run app.py
   ```

🎉 이제 윈도우에서도 맥북에서 보던 것과 똑같은 화면이 브라우저에 짠! 하고 나타납니다.

### ⚠️ 자주 발생하는 윈도우 경로 오류 해결법
- **명령어 오류**: `python3` 명령어를 찾을 수 없다고 나오면 무조건 `python`으로 바꿔서 입력해 보세요.
- **슬래시 방향**: 윈도우는 경로를 표시할 때 `/`(슬래시) 대신 `\` (백슬래시/원화표시)를 사용합니다. 명령 프롬프트에서 경로를 직접 칠 때는 이 점에 유의해 주세요.
- **권한 오류**: 가상환경 실행이 안 된다면 관리자 권한으로 PowerShell을 열고 `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`를 꼭 실행해 주세요.
