# 작은 화실 (hwasil) — 이어서 작업하기 (v6)

## 한 줄 요약
산사 스타일 멀티플레이 3D 가상 화실. 폰 우선, 지인 초대 전용, 학원 색 없음. 한국어 / 친근한 남자 선생님 말투 / 예시 중심.

## 지금 어디서 돌아가나
- 주소: https://jakeun-hwasil.vercel.app/  (초대 링크 = 주소 + `#c=입장코드`)
- 입장 코드: 입장 화면에서는 안 물어봄. `backend.js`의 `OPEN_CODE`가 자동으로 들어감(= 주소를 아는 사람은 누구나 입장). 코드를 바꾸면 `OPEN_CODE`도 같이 바꿔서 재배포해야 함. 코드가 안 맞으면 입력 칸이 다시 나타남.
- Vercel 프로젝트: `jakeun-hwasil` (팀 dbsrugks-projects, team_1lA40DV0lR9QYGgUsIEKJgj3, prj_vUVwnB7Vda5wtwolaTvjkshDa7Sj)
  - Git 자동 배포 **안 걸려 있음**. 고친 뒤에는 수동 배포:
    create_deployment(project=jakeun-hwasil, target=production,
    gitSource={github, dbsrugk/misulzip-site, ref=claude/unclear-request-hkm49q, sha=<커밋>},
    projectSettings.rootDirectory="hwasil")
- 코드 위치: 저장소 `dbsrugk/misulzip-site`, 브랜치 `claude/unclear-request-hkm49q`, 폴더 `hwasil/`
  - `main`에 합치지 않음 (합치면 misulzip.vercel.app/hwasil 로 노출됨). 일부러 브랜치에만 둠.

## 파일
- `index.html` — v5 화실(Three.js r128) + 입장 코드 화면 + 카메라 개선. 그림/3D 로직은 v5 그대로.
- `backend.js` — `window.claude.use('room'|'db'|'user')`를 흉내 내는 Supabase 연결 부품. 화실 코드는 이걸 그대로 호출.
- `sql/001_init.sql` — DB 스키마 (이미 적용됨). `.vercelignore`로 배포에서 빠짐.

## DB (Supabase `design-part-archive`, ldmsoceblbyvcoddquvn)
- 별도 스키마 `hwasil` (API에 노출 안 됨): `config`(code_hash), `works`(owner,id,at,doc), `gallery`(id,owner,at,doc)
- 바깥에서는 `public.hwasil_*` RPC로만 접근. 모든 RPC가 입장 코드를 먼저 확인.
  - hwasil_check / works_list / work_set / work_patch / work_del / gallery_list / gallery_set / gallery_del
- 기존 학원 테이블·권한은 건드리지 않음. anon이 hwasil 스키마 직접 접근 불가 확인함.
- 한도: 1인 그림 60점, 전시 10점, 문서 260KB.
- 입장 코드 바꾸기 (SQL Editor):
  `update hwasil.config set v = encode(sha256(convert_to('새코드','UTF8')),'hex') where k='code_hash';`
  → 기존 초대 링크 전부 막힘. 새 링크 다시 돌리기.

## 사람 구분 (가입 없음)
- 기기마다 localStorage `hw-key`(랜덤 32hex) = 비밀 열쇠. 서버는 sha256 앞 16자를 owner(공개 id)로 씀.
- 브라우저 데이터를 지우면 목록이 안 보임 (전시된 건 남음). 기기 옮기기·복구는 '내 열쇠 복사'로 미리 복사해 두면 됨.
- 입장 코드는 `hw-code`에 저장 → 다음부터 코드 칸 숨김.

## 실시간 (Supabase Realtime, 공개 채널)
- 채널 이름: `hw-<sha256('hwasil-room:'+코드) 앞16>-lobby` / `-studio-1..6`
- 로비 presence `{r}` 로 방 인원 세기, 방 presence `{n,c,e,x,z,h,w}` (느리게, 2.5초), 위치 `_pos` 브로드캐스트(약 4.5Hz)
- 그림 프로토콜 그대로: `_m` 브로드캐스트 안에 {t: 'dn'|'ds'|'dwant', d}
- 전시 바뀌면 로비에 `_gal` → 다들 전시관 새로고침. 그 외 60초마다 새로고침.
- 무료 한도 월 200만 메시지 — 위치 전송을 줄여 둔 이유.

## v6에서 바뀐 것
- Claude 아티팩트 → Supabase + Vercel 이사 완료.
- 카메라: 벽에 끼워 당기던 것 제거, 항상 거리 17 유지. 화실↔전시관 경계 벽·벽걸이 물건은 카메라가 바깥이면 숨김. 바깥 바닥 추가.

## v6.1에서 추가
- 이젤/액자 누르기: 3D 화면을 짧게 탭하면 레이캐스트로 판정. 빈 이젤 → 자동으로 걸어가서(전시관에 있으면 문을 거쳐) 앉음,
  누가 앉은 이젤 → 바로 구경 화면, 채워진 액자 → 크게 보기. 조이스틱/키보드를 쓰면 자동 걷기 취소. 막히면 안내 문구.
- 내 열쇠 옮기기: 내 그림 창 아래 '다른 기기로 옮기기'. 열쇠 복사(32자리, 4자씩 하이픈) / 붙여넣어 바꾸기(두 번 눌러 확인 후 새로고침).
  `window.hwasil.getKey()/setKey()` (backend.js). 열쇠를 아는 사람은 그 그림을 지울 수도 있음.

## 아직 못 한 것 / 다음 할 일
1. ⭐ 실제 폰 2대 시험 (서로 보임 / 그리기 구경 / 저장 / 전시). 혼자만 보이면 Realtime 공개 채널 설정 확인.
2. 시험 결과 고치기 → 수동 재배포.
3. (선택) 사용량 확인.
- 방 배정은 동시 입장 시 20명을 1~2명 넘을 수 있음 (v5와 같음).

## 사용자 선호
한국어만 / 접근 방식 먼저 확인 / 추천은 ⭐ / "ㄱㄱ" = 추천안 진행 / 끝나면 결과 링크.
- Supabase 마이그레이션은 승인 창이 폰 앱에선 안 뜸 → PC에서 진행해야 함.
