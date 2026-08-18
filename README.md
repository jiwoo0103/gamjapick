# gamjapick

국내외 공개 인기·트렌드 데이터를 수집해 카드뉴스 주제 후보를 찾는 개인용 도구입니다.

현재는 Stage 1-2까지 구현되어 있습니다. 수집 결과는 JSON으로 누적되며, 대시보드는 다음 단계에서 추가합니다.

## 실행

```powershell
npm install
npm run collect:check
```

`npm run collect:check`은 파일을 바꾸지 않고 수집 결과를 확인합니다. `npm run collect`은 `data/current.json`·`data/recent.json`을 갱신합니다. 두 명령 모두 여섯 collector의 성공·실패 상태와 각 성공 source의 샘플 항목을 출력합니다. 차단 응답(401/403/429)은 우회하지 않고 해당 source만 실패로 표시합니다.

## 로컬 번역 초기화

해외 제목은 Argos Translate의 영어→한국어 로컬 모델로 번역하며, 원문은 항상 함께 보존합니다. 최초 한 번 아래를 실행합니다.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r scripts\translate\requirements.txt
$env:XDG_DATA_HOME = "$PWD\.argos-data\data"
$env:XDG_CONFIG_HOME = "$PWD\.argos-data\config"
$env:XDG_CACHE_HOME = "$PWD\.argos-data\cache"
.\.venv\Scripts\python.exe scripts\translate\install-argos-model.py
```

`.venv`와 `.argos-data`는 로컬 전용이며 Git에 포함되지 않습니다. 모델이 준비되지 않았거나 번역에 실패해도 원문 제목을 유지합니다.

## 자동 수집

GitHub Actions workflow는 30분마다 `npm run collect`를 실행하고 변경된 `data/current.json`·`data/recent.json`만 `main`에 자동 커밋합니다. Actions 탭에서 **Collect topic radar data**를 선택하면 `workflow_dispatch`로 수동 실행할 수 있습니다.
