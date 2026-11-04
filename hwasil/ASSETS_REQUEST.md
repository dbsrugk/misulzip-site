# GPT(크롬)에게 보낼 자료 요청문 — 도토리 미술관 퀄리티용

사용법: 아래 코드 블록 전체를 ChatGPT에 붙여넣는다. 받은 zip(`dotori-assets.zip`)을 Claude 채팅에 올리면, Claude가 하나씩 확인하고 `hwasil/art`, `hwasil/textures`, `hwasil/frames`, `hwasil/models`, `hwasil/sounds`, `hwasil/brand`에 넣고 코드에 연결한다.
우선순위: **A 명화 → B 질감 → D 조각상 3D** → C 액자 → F 대표 이미지 → E 소리.
못 받는 항목은 건너뛰어도 된다(사이트마다 로그인이 필요하거나 막혀 있을 수 있음).

```
나는 "도토리 미술관"이라는 3D 온라인 미술관 웹사이트를 만들고 있어. 퀄리티를 높이기 위해 아래 자료들이 필요해. 인터넷에서 찾아서 내 컴퓨터에 내려받아줘.

[모든 자료에 공통으로 지킬 것]
1. 라이선스: 퍼블릭 도메인(PD) 또는 CC0만. 출처 페이지에서 라이선스 문구를 직접 확인한 것만 받아줘. "CC BY"나 "비상업적 사용만", 출처 표시가 필요한 것, 확실하지 않은 것은 받지 말고 이유를 적어줘.
2. 파일을 지어내거나 AI로 비슷하게 그리지 마. 실제 사이트의 실제 파일만.
3. 받은 파일마다 아래 정보를 CREDITS.csv로 정리해줘:
   파일이름, 출처 페이지 주소, 라이선스, 작가/제작자, 원본 해상도
4. 이름은 아래 지정한 파일명 그대로, 폴더별로 정리해서 마지막에 zip 하나로 묶어줘.
5. 용량을 아껴야 해서, 아래 적은 해상도·용량을 넘기지 말아줘.

[A] 명화 24점 → 폴더 art/
위키미디어 커먼즈(commons.wikimedia.org)에서 퍼블릭 도메인 고화질 사진. 가로 또는 세로 중 긴 쪽이 1400픽셀 정도인 JPG, 한 장당 500KB 이하. 각 작품의 커먼즈 파일 페이지를 열어서 (1) 그림이 정말 그 작품인지 (2) 라이선스가 PD인지 확인하고 받아줘. 색이 심하게 바랜 사진보다 보정된 버전(색이 자연스러운 것)을 우선해줘.
파일명 = id.jpg
monalisa 모나리자(레오나르도 다 빈치), venus 비너스의 탄생(보티첼리), adam 아담의 창조(미켈란젤로), lastsupper 최후의 만찬(레오나르도 다 빈치), pearl 진주 귀걸이를 한 소녀(페르메이르), nightwatch 야경(렘브란트), meninas 시녀들(벨라스케스), milkmaid 우유를 따르는 여인(페르메이르), liberty 민중을 이끄는 자유(들라크루아), wanderer 안개 바다 위의 방랑자(프리드리히), gleaners 이삭 줍는 사람들(밀레), conscience 깨어나는 양심(윌리엄 홀먼 헌트), sunrise 인상 해돋이(모네), lilies 수련(모네, 한 점만), grandejatte 그랑드자트 섬의 일요일 오후(쇠라), galette 물랭 드 라 갈레트의 무도회(르누아르), starry 별이 빛나는 밤(반 고흐), sunflowers 해바라기(반 고흐, 런던 내셔널 갤러리 버전), scream 절규(뭉크), kiss 키스(클림트), wave 가나가와의 큰 파도(호쿠사이), inwang 인왕제색도(정선), mongyu 몽유도원도(안견), miin 미인도(신윤복)
※ 한국 작품 3점(inwang, mongyu, miin)은 고화질이 없으면 건너뛰고 알려줘.

[B] 바닥·벽·천장 질감(타일처럼 끊김 없이 이어지는 seamless 텍스처) → 폴더 textures/
ambientCG(ambientcg.com) 또는 Poly Haven(polyhaven.com)에서 CC0만. 한 종류당 1K(1024픽셀) JPG의 "Color"(색) 이미지 1장씩, 한 장당 400KB 이하.
파일명 | 설명
marble_white.jpg | 밝은 대리석
marble_black.jpg | 검은 대리석(흰 줄무늬)
terracotta_tile.jpg | 테라코타 타일
wood_floor_light.jpg | 밝은 마룻바닥
wood_floor_dark.jpg | 짙은 호두나무 마룻바닥
plaster_wall.jpg | 크림색 회벽
fabric_red.jpg | 붉은 벨벳 또는 카펫
stone_beige.jpg | 베이지색 석재(기둥, 벽용)

[C] 액자 장식 → 폴더 frames/
OpenGameArt(opengameart.org) 또는 위키미디어 커먼즈에서 CC0/PD인 "화려한 금색 액자" 이미지. 가운데가 투명하게 뚫린 PNG면 가장 좋아. 가로가 800픽셀 안팎, 한 장당 300KB 이하. 서로 다른 스타일 3개(고전풍 금색, 단순한 나무, 곡선이 많은 바로크). 파일명: frame_gold.png, frame_wood.png, frame_baroque.png.
투명 PNG가 없으면 "액자만 정면에서 찍은 사진"이라도 받아줘.

[D] 조각상 3D 모델 → 폴더 models/
Smithsonian 3D(3d.si.edu), Sketchfab에서 "CC0" 필터, Poly Haven 모델 중에서 고전 조각상 흉상이나 전신상. GLB 형식, 한 개당 5MB 이하. 3~5개.
- 서양 고전 흉상 2개 (파일명 bust_1.glb, bust_2.glb)
- 전신상 또는 반신상 1~2개 (statue_1.glb, statue_2.glb)
- 꽃병이나 항아리 1개 (vase_1.glb)
5MB를 넘으면 더 가벼운 버전이 있는지 찾아줘. 없으면 넘기고 파일 크기와 함께 알려줘.

[E] 소리(선택) → 폴더 sounds/
Freesound(freesound.org)에서 CC0만. MP3나 OGG, 한 개당 200KB 이하, 10~30초.
- footsteps_marble.mp3: 대리석 바닥 발소리(루프)
- fountain_loop.mp3: 분수 물소리(끊김 없이 반복)
- room_tone.mp3: 넓은 홀의 조용한 공기 소리

[F] 대표 이미지(직접 만들어도 되는 것) → 폴더 brand/
저작권이 있는 캐릭터나 로고는 절대 흉내 내지 말고, 완전히 새로 그린 원본으로 만들어줘.
1. mascot.png: 웃는 도토리 마스코트(둥근 모양, 따뜻한 갈색 모자, 동글동글한 만화 스타일, 투명 배경, 1024x1024)
2. og.jpg: 링크 미리보기용 이미지(1200x630). "도토리 미술관" 글자와 긴 복도, 금색 액자, 따뜻한 조명이 있는 박물관 일러스트
3. logo.png: 도토리 모양 간단한 로고(투명 배경, 512x512)

[마무리]
전체를 dotori-assets.zip 하나로 묶어줘(30MB 이하가 되도록). 못 받은 항목과 이유를 맨 위에 따로 정리해줘.
```

## 받은 뒤 Claude가 할 일 (연결 계획)
- A: `catalog.js`의 각 작품 `img`에 `art/<id>.jpg` 상대 주소(이미 `drawCat`/`catImage`가 가까이 가면 그림을 그림). CREDITS.csv로 설명판/도록에 출처 표기.
- B: 지금 단색/캔버스 체커인 바닥·벽·카펫(`FLOORS`, `CARPET`, `wall()` 재질)을 `textures/`로 교체(TextureLoader, 반복 설정, 모바일은 1K 유지).
- C: `addSlot`의 액자 상자(`L(0x3a2a1c)`)를 액자 이미지/재질로 교체(명화 구역은 금색, 신진 작가관은 나무).
- D: three r128용 GLTFLoader(jsdelivr npm three@0.128.0/examples/js/loaders/GLTFLoader.js)로 `models/*.glb` 로드, 로비·로툰다·대회랑의 `makeBust`/받침대 자리에 배치(가벼운 LOD, 가까이 갈 때만).
- E: `music` 객체 옆에 효과음 레이어(발소리·분수·룸톤) 추가, 볼륨은 기존 슬라이더에 연동.
- F: `hwasil/og.jpg`·로고·파비콘 교체(`tests/og.js`는 옛 생성기).
