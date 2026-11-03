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

## v6.2 야외 세상 (진행 중)
- 화실 동쪽 벽에 문(z=0)이 있고, 밖은 들판(x 33~146, z -56~56). 그 너머 x>150은 바다. 하늘색 배경 + 안개.
- 만든 곳: 산 전망대(85,-46, 북쪽 산을 봄, 이젤 20~23번), 바닷가(141, z -10~10, 동쪽 바다를 봄, 이젤 24~27번).
  장식: 산·눈 덮인 봉우리·언덕·구름·나무(인스턴싱)·등대 섬·돛단배·파도 거품·모래사장·판자길·난간·파라솔·간판.
- 이젤 추가 방법: `addEaselAt(x, z, th)` (th = 이젤에서 앉는 사람 쪽 방향 각도). 이젤 번호는 만든 순서(화실 0~19, 그 뒤 야외).
- 장소 이동: `PLACES` 배열(이름·설명·좌표·방향·pitch) → '장소 이동' 시트. 새 장소는 PLACES에 한 줄 + 야외 블록에 장식 추가.
- 걷기: `walkable()`에 동쪽 문과 들판 추가, 이젤 눌러 걷기는 `walkTarget()`이 문을 거쳐 감. 원격 아바타 좌표 제한도 넓혔음.
- 호숫가(LAKE 72,40 r13; 이젤 28~31번, 북쪽 물가에서 남쪽을 봄): 물, 모래 둘레, 수련, 갈대, 노 젓는 배, 호수를 둘러싼 나무. 호수 안은 `walkable()`에서 막힘.
- 풍차 들판(MILL 112,45; 이젤 32~35번, z=29에서 남쪽을 봄): 돌아가는 풍차, 꽃 420송이(인스턴싱), 건초더미.
- 인스턴싱 메시는 `frustumCulled=false` 필수(기본값이면 원점이 화면 밖일 때 통째로 사라짐).
- 문: 화실↔전시관, 화실↔야외 모두 아치형(폭 7.6 = 2*DOOR, 직선 4.7 + 반원). `archWallGeo()/archFrameGeo()`. 전시관 간판은 아치 위로 올림.
- 다음 후보: 숲길. 필요하면 눈 덮인 산, 벚꽃길, 밤하늘.

## v6.3 풍경 보며 그리기
- 그림판에 '풍경 끔 / 풍경 위 / 겹쳐 보기'. 야외 이젤은 기본 '풍경 위'(위 30%에 앉은 자리에서 본 풍경, 아래에서 그림), 선택은 localStorage `hw-view`.
- 겹쳐 보기: 풍경이 전체 화면 뒤에 깔리고 종이가 반투명(슬라이더 `--ghost`).
- 구현: `pad.view`, `applyView()`, `viewFor()`; update()에서 'artist' 카메라(앉은 자리 눈높이, 내 이젤·아바타 숨김); frame()에서 scissor/viewport로 위쪽만 그림.
- 땅 평면은 해안(x=150)에서 끝남(바다와 z-fighting 방지), 카메라 near=1.

## v6.4 둘러보기·미리보기
- 그림판 위쪽 풍경 칸을 끌어서 둘러보기(좌우 ±150°, 위아래), 두 손가락/휠로 확대, 두 번 누르면 처음 방향. 상태는 `look {yaw,pitch,zoom}`, 앉을 때마다 초기화.
- '풍경 위'가 모든 이젤의 기본값(저장된 선택 `hw-view`가 있으면 그걸 씀). 카메라는 앉은 자리 눈높이(내 이젤·아바타 숨김).
- 링크 미리보기: `<head>`의 og:* / twitter:* 태그 + `hwasil/og.jpg`(1200x630, 풍차 들판). 다시 만들 땐 `NODE_PATH=$(npm root -g) node hwasil/tests/og.js`. 카카오톡은 미리보기를 캐시하므로, 이미 보낸 링크는 안 바뀔 수 있음(새 링크는 주소 끝에 `?v=2` 같은 걸 붙이면 새로 읽음).
- 파비콘은 🎨 이모지(데이터 URL).

## v7 (큰 개편)
- 캐릭터: 둥근 툰 캐릭터. `makeAvatar(look)`, look = 7자리(피부,머리,머리색,모자,옷색,소품,얼굴) = `hw-look`. 꾸미기 시트(#dress)는 미리보기를 메인 렌더러로 작은 렌더타깃에 그림. 프레즌스 필드 `a`(look), `m`/`mt`(표현 id/카운터).
- 표현(EMOTES: 손 흔들기, 박수, 하트, 춤, 깜짝) `startEmote()`, 머리 위 이모지 `fxList`, 걷는 먼지 `puff()`(고품질만). 멈출 때 미끄러지듯 감속(`curSp`), 걸을 때 앞으로 기울기.
- 배경: 툰 재질(`L()`), 해 방향 `SUN` + 플레이어를 따라다니는 그림자(`sunFollow`), 하늘 돔 셰이더, 안개, 풀 질감, 바람(`sway()`), 바다/호수 셰이더(`waterMat`), 둥근 나무·덤불·바위, 나비·꽃가루·새, 화분. 그래픽 품질 `hw-q` hi/lo(낮음=그림자·풀·나비 줄임, 느린 폰은 자동 하향. 자동화 테스트는 `navigator.webdriver`로 제외).
- 건물: 천장 18(`RM.h`), 문 `DOOR=5.2, DSH=7.6`(아치), 들보·기둥·몰딩·샹들리에·아치 창.
- 액자: 42칸 `addSlot(room,size,...)` (화실 15 + 전시관 27), 크기 s/m/l(`FD`), 작품 비율대로 액자 모양(`applyAspect`). 전시 문서에 `room`('gallery'|'studio')·`size`, 작품 문서에 `er`·`es`. 걸기 창 #hang. 한 번에 최대 60점 불러옴.
- 시험(`hwasil/tests`): 가짜 Supabase에 메모리 DB 포함, WebGL 콘솔 오류도 실패로 침. `window.__hw` 훅(테스트 전용: pos, easels, remotes, slots, emote, look, go).

## 아직 못 한 것 / 다음 할 일
1. ⭐ 실제 폰 2대 시험 (서로 보임 / 그리기 구경 / 저장 / 전시). 혼자만 보이면 Realtime 공개 채널 설정 확인.
2. 시험 결과 고치기 → 수동 재배포.
3. (선택) 사용량 확인.
- 방 배정은 동시 입장 시 20명을 1~2명 넘을 수 있음 (v5와 같음).

## 사용자 선호
한국어만 / 접근 방식 먼저 확인 / 추천은 ⭐ / "ㄱㄱ" = 추천안 진행 / 끝나면 결과 링크.
- Supabase 마이그레이션은 승인 창이 폰 앱에선 안 뜸 → PC에서 진행해야 함.
