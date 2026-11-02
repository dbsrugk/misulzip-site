# 작은 화실 — 자동 점검·보완 절차 (AUTOPILOT)

정해진 시간마다 새 세션이 이 문서를 읽고 따라 합니다. 사람이 시킨 일이 아니라 **스스로 하는 품질 보완**이에요.
규칙의 맨 위에는 "하면 안 되는 것"이 있고, 이건 예외 없이 지킵니다.

## 하면 안 되는 것
- 운영(production) 배포를 하지 않는다. 미리보기(preview) 배포까지만. 운영 배포는 사용자가 "ㄱㄱ"라고 한 뒤에만.
- Supabase에 쓰기(DDL·insert·update·delete·migration)를 하지 않는다. 읽기(로그, select)만. DB 변경이 필요하면 CHANGELOG에 "DB 변경 필요: …"라고 적고 멈춘다.
- 입장 코드(`OPEN_CODE`)·열쇠(`hw-key`) 처리·권한 관련 SQL을 바꾸지 않는다.
- 기능을 없애거나 화면 구성을 크게 바꾸지 않는다. 한 번에 작은 변경 1~3개.
- `main` 브랜치, `hwasil/` 밖의 파일(미.술집 사이트)을 건드리지 않는다. PR을 만들지 않는다. force push 하지 않는다.
- 비밀 값(키, 토큰)을 파일·커밋·로그에 적지 않는다.
- 시험이 하나라도 실패하면 그 변경은 되돌리고 반영하지 않는다.

## 작업 위치
- 저장소 `dbsrugk/misulzip-site`, 브랜치 `claude/unclear-request-hkm49q`, 폴더 `hwasil/`.
- 시작할 때 `git fetch origin claude/unclear-request-hkm49q && git checkout claude/unclear-request-hkm49q && git pull --rebase`.
- 푸시 전에도 `git pull --rebase`. 충돌하면 이번 회차는 반영하지 말고 CHANGELOG에만 적고 끝낸다(사용자가 같은 브랜치에서 작업 중일 수 있음).

## 순서
1. `HANDOFF.md`, `CHANGELOG.md`를 읽는다. 이미 해결했거나 사용자가 일부러 그렇게 둔 것은 다시 건드리지 않는다.
2. **점검** (역할별로 Agent 하위 에이전트를 병렬로 써도 됨, 각자 읽기 전용):
   - 연결: Supabase 프로젝트 `ldmsoceblbyvcoddquvn`의 로그(`query_logs`, 최근 1~2시간). `realtime_logs`의 오류, `edge_logs`에서 `/rest/v1/rpc/hwasil_*`의 4xx/5xx, `/realtime/v1/api/broadcast`가 많으면(=웹소켓이 안 붙고 우회 중) 문제, 기기 진단은 `request.url like '%dg%7E%'`(backend.js의 diag). 사용량이 월 200만 메시지 한도에 가까운지.
   - 화면: `bash hwasil/tests/run.sh`로 시험하고 `hwasil/tests/out/*.png`(산 전망대, 바닷가, 화실, 그림판 보기들)를 직접 눈으로 본다. 깨짐, 겹침, 글자 잘림, 어색한 색/크기, 폰(390x800)에서 안 맞는 곳을 찾는다.
   - 성능: 폰에서 무거울 만한 것(빈번한 DOM/캔버스 갱신, 많은 메시지, 큰 그림 데이터), 메모리 누수.
   - 안전: 입력 길이, 서버 RPC에 넘기는 값, 남의 그림 접근 가능성(읽기만으로 판단, 이상하면 CHANGELOG에 경고).
3. **우선순위**: 동작 오류 > 폰에서 쓰기 불편 > 눈에 띄는 어색함 > 성능 > 장식. 이번에 고칠 것 1~3개만 고른다. 고칠 게 없으면 억지로 만들지 말고 "이번엔 변경 없음"으로 끝낸다.
4. **고치기**: 작게 고치고, 가능하면 `hwasil/tests/`에 시험을 더한다. 고친 뒤 `bash hwasil/tests/run.sh`를 다시 돌려 전부 통과해야 한다. `new Function`으로 인라인 스크립트 문법도 확인.
5. **기록**: `CHANGELOG.md` 맨 위에 이번 회차를 한국어로 적는다(날짜, 찾은 것, 고친 것, 못 고친 것/사용자가 정해야 할 것). `HANDOFF.md`에 구조가 바뀐 내용이 있으면 반영.
6. **반영**: 커밋(메시지 끝에 세션이 알려준 attribution 줄) → `git pull --rebase` → `git push origin claude/unclear-request-hkm49q`.
7. **미리보기 배포**: Vercel `create_deployment` (team `team_1lA40DV0lR9QYGgUsIEKJgj3`, project `prj_vUVwnB7Vda5wtwolaTvjkshDa7Sj` = jakeun-hwasil), **target 생략(=preview)**, gitSource github dbsrugk/misulzip-site ref 브랜치 sha 방금 커밋, projectSettings.rootDirectory `hwasil`. 완료될 때까지 `get_deployment`로 확인하고 READY 주소를 요약에 적는다. (변경이 없으면 배포하지 않는다.)
8. **마무리 요약** (한국어, 짧게): 찾은 것 / 고친 것 / 미리보기 주소 / 사용자가 해야 할 일. 최근 두 번 연속 의미 있는 변경이 없었다면 "이제 하루 1번으로 바꿔도 좋아요"라고 덧붙인다.

## 알아두기
- 진짜 Supabase 실시간은 샌드박스에서 접속이 막혀 있어 시험하지 못한다. 로그로만 판단한다.
- DB를 바꾸는 승인 창은 폰에서 안 떠서 자동으로 못 한다.
- 개발 흐름: 사용자는 가끔 직접 같은 브랜치에서 작업한다. 항상 pull 먼저.
