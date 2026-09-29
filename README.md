# Carrot Explorer — 배포 가이드

mystudy.carrotworld.kr과 같은 구조예요: **Cloudflare Pages**(화면) + **Pages Functions**(API) + **D1**(데이터베이스). 하나의 프로젝트로 한 번에 배포돼요.

이 작업은 April님 컴퓨터(또는 Claude Code)에서 터미널로 직접 실행하셔야 해요 — 여기(채팅)에서는 Cloudflare 계정에 직접 로그인/배포를 할 수 없어요.

---

## 0. 준비물

- Node.js 설치되어 있을 것 (`node -v` 로 확인)
- Cloudflare 계정
- 터미널에서:
  ```bash
  npm install -g wrangler
  wrangler login   # 브라우저 열려서 Cloudflare 로그인
  ```

## 1. 압축 풀고 설치

```bash
cd carrotworld-explorer
npm install
```

## 2. D1 데이터베이스 만들기

```bash
wrangler d1 create carrotworld-explorer-db
```

실행하면 이렇게 나와요:

```
[[d1_databases]]
binding = "DB"
database_name = "carrotworld-explorer-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

이 `database_id` 값을 복사해서 `wrangler.toml` 파일의 `REPLACE_WITH_YOUR_DATABASE_ID` 자리에 붙여넣으세요.

## 3. 테이블 만들기 (스키마 적용)

```bash
wrangler d1 execute carrotworld-explorer-db --remote --file=schema.sql
```

## 4. (선택) 데모 데이터 넣기

지금 프로토타입에 있던 5개 프로그램 + Ella/Noah/Mia 데모 데이터를 그대로 넣고 싶으면:

```bash
wrangler d1 execute carrotworld-explorer-db --remote --file=seed.sql
```

빈 상태로 시작하고 싶으면 이 단계는 건너뛰세요 — 선생님/부모님이 직접 등록하면 돼요.

## 5. 배포

```bash
npm run build
wrangler pages deploy dist --project-name=carrotworld-explorer
```

처음 실행하면 "새 프로젝트를 만들까요?" 물어봐요 → 네(Y).

## 6. D1을 Pages 프로젝트에 연결 (중요! 이거 안 하면 API가 작동 안 해요)

`wrangler.toml`에 D1 설정을 써놨어도, Pages 프로젝트 자체에는 자동으로 연결 안 될 수 있어요. 확실하게 하려면:

1. Cloudflare 대시보드 → **Workers & Pages** → `carrotworld-explorer` 프로젝트 클릭
2. **Settings** → **Functions** → **D1 database bindings**
3. **Add binding** 클릭
   - Variable name: `DB`
   - D1 database: `carrotworld-explorer-db`
4. 저장 후 한 번 더 배포: `wrangler pages deploy dist --project-name=carrotworld-explorer`

## 7. 도메인 연결

1. Cloudflare 대시보드 → 방금 그 Pages 프로젝트 → **Custom domains**
2. **Set up a custom domain** 클릭 → 원하는 주소 입력 (예: `explorer.carrotworld.kr`)
3. 그 도메인이 이미 Cloudflare에서 관리 중이면 자동으로 연결돼요. 아니라면 안내해주는 DNS 레코드를 도메인 관리하는 곳에 추가하시면 돼요.

---

## 로그인 정보 (데모 데이터 기준)

- **Teacher PIN**: `0000`
- **Parent PIN**: Ella·Noah = `0000` (형제), Mia = `1111` (다른 가족)
- 실제 서비스에서는 학생등록 시 "부모님 휴대폰 뒷자리 4자리"를 입력하면 그게 곧 그 가족의 로그인 PIN이 돼요.

## 앞으로 코드 수정할 때

1. `src/App.jsx` 수정 (지금까지 Claude와 채팅하면서 만들어온 파일과 같은 구조예요)
2. `npm run build`
3. `wrangler pages deploy dist --project-name=carrotworld-explorer`

로컬에서 API까지 포함해서 미리 테스트해보고 싶으면:

```bash
npm run pages:dev
```

(프론트엔드 + Functions + D1을 로컬에서 한 번에 띄워줘요)

## 알아두시면 좋은 것

- 사진(학생 등록 시 자녀 사진은 안 씀, 프로그램 대표 사진만 있음)은 `data:` 형태로 그대로 D1에 저장돼요 — 지금 규모(프로그램 몇 개, 사진 몇 장)에서는 전혀 문제없지만, 나중에 사진이 아주 많아지면 Cloudflare R2로 옮기는 걸 고려하면 좋아요.
- API가 잠깐 안 되거나 오프라인이어도 화면은 안 죽어요 — 로컬 상태로 먼저 바뀌고, 서버 저장은 백그라운드에서 시도해요 (실패하면 콘솔에 경고만 남고 앱은 계속 써져요). 완전한 오프라인 대응(재시도 등)은 아직 없어서, 다음 단계로 다듬으면 좋아요.
