# 도토리 미술관 (옛 이름: 작은 화실, 폴더 hwasil) — 이어서 작업하기 (v9)

## 한 줄 요약
"작은 도토리가 되어 걸어 다니며 명화를 구경하는 3D 온라인 미술관 + 친구들과 함께 그리는 곳". 폰 우선, 지인 초대 전용.
한국어 / 친근한 선생님 말투 / 예시 중심. 방향: **그림 그리기는 줄이고 명화 박물관(루브르풍 대회랑)을 크게, 천천히 퀄리티를 올린다.**

## 사용자 선호 (꼭 지킬 것)
- 한국어만. 큰 변경은 접근 방식을 먼저 말하고 확인. 추천은 ⭐. 사용자가 "ㄱㄱ" = 추천안 진행. 끝나면 결과 링크(https://jakeun-hwasil.vercel.app/)로 마무리.
- "대기 타이머 알림은 이제 울리지 않게" → 배포 기다릴 때 Monitor/타이머를 쓰지 말고 상태만 직접 확인(get_deployment).
- 서버(Supabase) 변경은 승인 창이 **PC에서만** 뜸(폰 앱에선 안 보임). 승인 못 받으면 멈추고 사용자에게 "PC에서 허용 후 '다시'" 라고 안내.
- 저작권: 작가 사망 후 오래된(퍼블릭 도메인) 작품만 걸기. 남의 글·영상은 그대로 옮기지 말고 새로 쓰기. 실제 박물관 이름·로고 사용 금지(루브르풍 분위기만).

## 지금 상태 (맨 먼저 읽기)
- **운영 배포 최신 = 커밋 `906d964`** (배포 id dpl_6Y2Z7H4RcivWFRRd8jNVrTmmysA5, READY). 전체 시험 95개 통과.
- **사용자가 기다리는 결정**: "구역 나누기 방법 1" — 미술관(명화: 로비·로툰다·대회랑, 이젤 없음, 클래식) / **아틀리에 = 동쪽 문 바로 밖 오른쪽 땅에 나무 오두막**(이젤 6~10개, 물감 선반, 난로, 그림판·'전시하기'는 여기서 시작) / 친구들 전시(신진 작가관+별관+서쪽 전시관+정원 2곳, 밝은 나무 톤·따뜻한 조명, 입구 간판 "친구들의 작품 · 신진 작가")로 3분할. 로비 이젤 6개는 오두막으로 옮기고 로비는 안내 데스크·조각만. 사용자가 **"ㄱㄱ"** 하면 진행(아직 안 함). ⚠ 이젤 번호가 바뀌므로 `tests/smoke.js`의 `go(11)`(바닷가 이젤)·`go(3)`(로비 이젤)·`n >= 22`와 `tests/two.js`의 `easelXY` 범위를 같이 고칠 것.
- **사용자가 할 일(출근 후 PC)**: ① Supabase 승인 창 "허용" → 마이그레이션 004 적용 ② GPT(크롬)로 자료 받기: `hwasil/ASSETS_REQUEST.md`의 요청문을 GPT에 붙여넣고 받은 zip을 Claude 채팅에 올림 ③ 접속 주소를 하나 더 만들지(예: dotori-museum.vercel.app, 옛 주소 유지) 결정 ④ 관리자 비밀번호 더 길게 바꿀지(지금은 4자리).
- 클라우드 세션은 commons.wikimedia.org / instagram / youtube / metmuseum / artic.edu 접속 불가(환경 설정 '네트워크 접근'에서 허용해야 함). 데스크톱 채팅방 + Claude in Chrome이면 직접 받을 수 있음.
- 사용자가 보낸 참고 자료: 인스타 도슨트 릴스 1개(영상 파일로 받아 장면 확인함: 그림 속 디테일 4~5곳을 확대·이동하며 한 줄 자막으로 이야기 → 마지막에 액자에 걸린 전체 모습 + 긴 설명글). 내용은 그대로 쓰지 말고 형식만 참고해 새로 쓸 것(도슨트 투어 기능 TODO).
- 사용자가 거부/보류한 것: **크로키 모드는 안 함**, **비 오는 날씨는 싫음(기본 맑음 고정, 비·눈·안개는 설정에서 직접 고를 때만)**, 낮/노을/밤은 좋음.

## 어디서 돌아가나
- 주소: https://jakeun-hwasil.vercel.app/ (접속 주소 이름 변경은 사용자 결정 대기: 새 주소를 하나 더 추가할지)
- 코드: 저장소 `dbsrugk/misulzip-site`, 브랜치 `claude/unclear-request-hkm49q`, 폴더 `hwasil/`. `main`에는 합치지 않음(합치면 misulzip 사이트에 노출).
- **배포는 수동**: Vercel MCP `create_deployment`:
  `name/project=jakeun-hwasil, target=production, slug=dbsrugks-projects, gitSource={type:github, org:dbsrugk, repo:misulzip-site, ref:claude/unclear-request-hkm49q, sha:<커밋>}, projectSettings={rootDirectory:"hwasil", framework:null, buildCommand:null, outputDirectory:null, installCommand:null}`
  ⚠ **rootDirectory "hwasil"을 빼먹으면 미술집 메인 사이트가 올라감**(한 번 사고 났음). 배포 뒤 주소를 열어 `<title>`이 "도토리 미술관"인지 확인.
- 입장 코드: 화면에서 안 물어봄. `backend.js`의 `OPEN_CODE`가 자동 입장. 코드를 바꾸면 `hwasil.config.code_hash`도 같이 바꿔야 함.
- Supabase: 프로젝트 `design-part-archive` (id `ldmsoceblbyvcoddquvn`), 스키마 `hwasil`(API에 노출 안 됨), 바깥에선 `public.hwasil_*` RPC만 사용. 모든 RPC가 입장 코드 확인.
- 사람 구분: 기기마다 localStorage `hw-key`; 서버는 sha256 앞 16자를 owner로 씀. 관리자: `hw-admin`(관리자 비밀번호는 이 기기 localStorage에만, 서버엔 `config.admin_hash`만. **비밀번호를 저장소·문서에 쓰지 말 것**).

## 서버 마이그레이션 상태 (`hwasil/sql/`)
- 001 기본 스키마 ✔ 적용됨 / 002 선착순 액자(slot) + 관리자(admin_check/admin_del) ✔ / 003 전시 목록 가볍게(gallery_index/gallery_get) ✔
- **004 (활동 기록 + 관리자 보관/재등록 차단) ❌ 아직 적용 안 됨** — PC에서 승인해야 함. 내용: 표 `events`(전시/내림 기록, 트리거), `visits`(하루 방문자, `hwasil_ping`), `removed`(관리자가 내린 작품 통째 보관), `_banned`(같은 작품/같은 그림 다시 걸면 `removed_banned`), 관리자 `hwasil_admin_removed/removed_get/unban`.
  적용 후 할 일: ① 클라이언트에서 `hwasil_ping`을 입장 시와 4분마다 호출(`backend.js`+`index.html`), ② 관리자 설정 칸에 "내린 작품 보관함"(목록·보기·다시 허용), ③ 매일 아침 보고(아래), ④ 테스트용 가짜 서버(`tests/lib.js`)에 새 RPC 추가.

## 지금 있는 기능 (요약)
- 월드: 로비(옛 화실 홀, 천장 26) — 가운데 이젤 6개 + 조각, 정면 큰 아치문 → **중앙 로툰다**(분수·기둥 8·천장 원형 하늘창·벤치·항아리, 40걸음) → **대회랑**(북쪽으로 192, 6개 전시구역 × 4점 = 명화 24점 자리; 구역별 벽·바닥·카펫·조명 색·음악 분위기가 다름, 구역 문(돌기둥+금 아치)·천장 유리·높은 창·벽 아래 판자·벤치·항아리·액자 위 작은 조명, 끝에 도토리 지킴이 조각). 로비 양옆 안내판. 도슨트 NPC 1 + 관람객 NPC 6(누르면 도슨트가 이용 팁 말풍선). 남쪽 = 신진 작가관(전시관→별관, 서쪽 전시관 1·2). 동쪽 문 = 야외(산·바다·호숫가·풍차들판·전시 정원·꽃길 정원).
- 명화: `hwasil/catalog.js`(`MUSEUM_WINGS`, `MUSEUM_CATALOG` 24점: id·제목·작가·연도·소장처·가로세로 비율·size·blurb[내가 새로 쓴 소개]·**img(비어 있음)**). 액자는 `room:'museum'`, `reserved=true`(아무도 못 걸음). 작품 앞 '작품 이야기 듣기' → 도슨트 카드(`showDocent`). 그림 파일이 생기면 `img`에 주소만 넣으면 가까이 갈 때 액자에 그려짐(`drawCat`/`catImage`).
- 사람들이 거는 작품: 선착순 액자 클레임(서버 유니크 slot), 주인만 수정, 관리자 비밀번호로 내리기, 알아서 걸기/직접 고르기/액자 앞 "여기에 걸기" 버튼, 저장 직후 전시 질문.
- 그리기: 연필·붓·지우개·페인트통·스포이트, 풍경 보며 그리기, 하트 보내기(구경 화면), **따라 그리기 가이드**(내 사진 반투명 겹치기·윤곽선·투명도·크기·옮기기·색 집기).
- 하늘: 30분 주기 일출/낮/노을/밤(별·달·반딧불). 날씨는 늘 맑음(`weatherNow()`가 'clear'만 반환), 비·눈·안개는 설정 '시간과 날씨'에서 직접 고를 때만. 음악: 브라우저가 만드는 힐링 음악. **입장 탭에서 바로 시작**(`music.unlock()`, 짧은 아르페지오), 새로고침 입장은 터치 필요(`music.hint()`). 대회랑 6개 구역마다 다른 곡 `MOODS`(류트/하프시코드/피아노 단조/온음/미니멀/오음음계).
- 이동: '장소 이동'은 걸어서 감(문을 하나씩 지남, 조이스틱 움직이면 멈춤). 대회랑·로툰다(분수 돌아가기)·서쪽 전시관·별관 경로 포함(`walkTarget`, `areaOf`).
- **장소 이름 배너**: 다른 곳에 들어가면(반 초 머문 뒤) 화면 위에 이름이 뜸(`areaNameAt`, `updateArea`, `#areaBanner`; 대회랑은 "대회랑 · 시대" + 설명). 테스트 훅 `__hw.area()`.
- 성능: 액자 텍스처는 가까이 갈 때만(`slotLOD`), 전시 목록은 요약만 받고 그림 선은 가까이 가면 받음, 그래픽 품질 hi/lo.

## 다음 할 일 (우선순위)
0. **구역 나누기 방법 1**(위 '지금 상태') — 사용자 "ㄱㄱ" 대기.
1. **자료 채우기**(명화 이미지·질감·액자·3D 조각상·소리·대표 이미지): 요청문 `ASSETS_REQUEST.md`, 연결 계획도 그 파일 맨 아래. 아래는 명화 세부. — 사용자가 GPT(크롬)로 위키미디어 커먼즈에서 퍼블릭 도메인 이미지를 id 이름으로(예: monalisa.jpg, 가로 1400px) 받아 zip으로 이 채팅에 올리면: 확인(작품이 맞는지 눈으로) → 크기 줄이기 → `hwasil/art/`에 넣기 → `catalog.js`의 `img`에 상대 주소 → 출처/라이선스 목록 정리 → 테스트 → 배포. (클라우드 세션은 commons.wikimedia.org 등에 접속 불가: 환경 설정 '네트워크 접근'에서 허용하면 직접 받을 수 있음.)
2. **서버 004 적용** + 위 후속(방문 기록, 관리자 보관함, 매일 아침 보고 예약 작업 `create_trigger`: 어제 방문자 수/이름, 전시 올림·내림·관리자 삭제 목록, 총 작품 수).
3. **도슨트 투어**: 작품 누르면 전체 화면에서 디테일 4~5곳을 천천히 확대·이동하며 한 줄 자막(참고한 형식: 인스타 도슨트 릴스. 내용은 새로 쓸 것), 끝에 '더 알아보기', '따라 그리기'(= 따라 그리기 가이드에 그 작품 깔기).
4. 박물관 퀄리티: 시대별 전시관 분위기(조명·바닥·음악), 스포트라이트, 석고상/동상 다듬기(또는 3D 모델 파일을 받아 쓰기), 도슨트·관람객·그림 그리는 NPC, 지도/추천 관람 코스.
5. 로비 한쪽 "아틀리에" 정리(그리는 곳 축소 완료 단계), 접속 주소/이름/링크 미리보기 썸네일 새로 만들기(`NODE_PATH=$(npm root -g) node hwasil/tests/og.js`).
6. 이전 후보: 붓 종류 늘리기, 동시접속 최적화(무료 Realtime 한도 약 100 msg/s), '내 그림' 목록 가볍게(서버 RPC 필요), 관리자 비밀번호 더 길게 바꾸기.
- 사용자가 "크로키는 됐고"라고 함 → 크로키 모드는 안 함.

## 시험
- 전체 약 14분(걷기 시험 3개가 느림: 로비→별관, 신진 작가관→서쪽 2, 로툰다→대회랑). 시험 도중 `index.html`을 고치지 말 것. `pkill -f hwasil/tests`는 자기 셸까지 죽이니 쓰지 말 것.
- `export NODE_PATH=$(npm root -g); bash hwasil/tests/run.sh` (약 12분: smoke.js + two.js, 가짜 Supabase+메모리 DB, 소프트웨어 렌더링이라 걷기 시험이 오래 걸림). **시험 도중에 index.html을 고치지 말 것**(결과가 섞여 가짜 실패가 남).
- 테스트 훅 `window.__hw`(tests/lib.js의 HOOK): pos, easels, slots, emote, look, music(), atm(), info(), tapSlot(i), admin(), walking(), go(i). `window.__hwInstant=true`면 장소 이동이 순간이동(테스트 기본값).
- 새 기능은 `tests/smoke.js`에 확인 추가, WebGL 콘솔 오류도 실패로 침.

## 구조 메모
- 파일: `index.html`(앱 전체 한 파일, Three.js r128), `backend.js`(Supabase 연결/브로드캐스트 방), `catalog.js`(명화 목록), `ASSETS_REQUEST.md`(GPT에게 줄 자료 요청문), `og.jpg`, `sql/`, `tests/`, `AUTOPILOT.md`(1시간마다 도는 자동 점검 규칙: 미리보기 배포만, 운영 배포·DB 쓰기 금지), `CHANGELOG.md`.
- 방(액자 room): gallery, annex, westa, westb, garden, orchard, studio, **museum(예약)**. 슬롯 id = `방:x,y,z`(소수 1자리) — 액자 위치를 바꾸면 선점 기록이 풀리니 조심.
- 실시간: 위치·표현은 브로드캐스트 `_st`(인원 적으면 빠르게), 그림 `dn/ds/dwant`, 하트 `dl`. Presence는 한도 때문에 안 씀.
- 하늘/날씨: `updateAtmosphere`, `ATM`, `atmHooks`. 장소 이동: `PLACES`, `goPlace`, `walkTarget`, `areaOf`.
- 새 큰 물체는 `hang(obj, 축, 한계, 안쪽)`으로 카메라 쪽에 따라 보이기/숨기기, 가리는 물체는 `addOccluder`.
