#!/usr/bin/env python3
"""
자동 데이터 업데이트 스케줄러 (시간 단위 갱신)
APScheduler를 사용하여 정기적으로 KOSPI 거래 데이터를 업데이트합니다.
"""

import sys
import time
from pathlib import Path
from datetime import datetime

# Windows encoding fix
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add parent directory to path to import update_latest_data
sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
except ImportError:
    print("⚠️ APScheduler 미설치. 설치 중...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "apscheduler"])
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger

from update_latest_data import main as update_data


def format_kst_now() -> str:
    """한국 시간 포맷"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def scheduled_update():
    """스케줄된 데이터 업데이트 작업"""
    print(f"\n[{format_kst_now()}] [UPDATE] 데이터 업데이트 시작...")
    try:
        update_data()
        print(f"[{format_kst_now()}] [SUCCESS] 데이터 업데이트 완료")
    except Exception as e:
        print(f"[{format_kst_now()}] [ERROR] 업데이트 실패: {e}")


def main():
    """스케줄러 메인 함수"""
    scheduler = BackgroundScheduler()
    
    # 매시간 정각에 업데이트 (00분 00초)
    # 평일(월-금) 09:00 ~ 16:00 시장 시간은 30분마다 업데이트
    scheduler.add_job(
        scheduled_update,
        CronTrigger(hour="9-15", minute="*/30", day_of_week="0-4"),  # 평일 09:00-15:30 (30분 단위)
        id="market_hours_update",
        name="Market Hours Update (30min)"
    )
    
    # 시장 외 시간: 매시간 정각에 한 번씩 업데이트
    scheduler.add_job(
        scheduled_update,
        CronTrigger(hour="16-23,0-8", minute="0"),  # 시장 외 시간
        id="after_hours_update",
        name="After Hours Update (hourly)"
    )
    
    # 초기 시작 시 한번 실행
    print(f"[{format_kst_now()}] [START] 스케줄러 시작 - 초기 업데이트 진행 중...")
    scheduled_update()
    
    # 스케줄러 시작
    scheduler.start()
    print(f"[{format_kst_now()}] [OK] 자동 업데이트 스케줄러 활성화됨")
    print("   [INFO] 평일 09:00-15:30: 30분 단위 업데이트")
    print("   [INFO] 시장 외 시간: 시간 단위 업데이트")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n[{format_kst_now()}] ⏹️ 스케줄러 종료")
        scheduler.shutdown()


if __name__ == "__main__":
    main()
