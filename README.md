# ToDo List

오늘의 할 일을 그룹별로 관리하는 웹 애플리케이션입니다.

![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## 주요 기능

### 할 일 관리
| 기능 | 설명 |
|------|------|
| 추가 | 텍스트 입력 후 `추가` 버튼 또는 `Enter` 키로 등록 |
| 설명 | `+ 설명` 버튼으로 상세 설명 입력, 항목에서 접기/펼치기 |
| 완료 처리 | 체크박스 클릭 시 완료 전환, 완료 시각 자동 기록 |
| 개별 삭제 | 각 항목의 `✕` 버튼으로 삭제 |
| 일괄 삭제 | 하단 `완료 항목 삭제` 버튼으로 완료된 항목 전체 삭제 |

### 그룹
| 기능 | 설명 |
|------|------|
| 그룹 생성 | `+` 버튼으로 이름을 자유롭게 지정해 그룹 추가 (예: Home, Work) |
| 그룹 삭제 | 그룹 탭의 `×` 버튼으로 삭제, 소속 항목은 자동으로 기타로 이동 |
| 그룹 지정 | 할 일 작성 시 드롭다운으로 그룹 선택, 미지정 시 기타로 분류 |
| 그룹 필터 | 그룹 탭 클릭으로 해당 그룹의 할 일만 조회 |

### 시간 기록
- **생성 시각** — 할 일 추가 시 자동 기록 (`YYYY-MM-DD HH:mm`)
- **완료 시각** — 체크박스 체크 시 자동 기록, 해제하면 제거

### 상태 필터 & 현황
- 전체 / 진행중 / 완료 탭으로 상태별 조회 (그룹 필터와 동시 적용)
- 하단에 현재 그룹 기준 남은 할 일 개수 실시간 표시

---

## 파일 구조

```
ToDo-List/
├── index.html       # 메인 페이지
├── app.js           # 기능 로직 (상태 관리, 렌더링, 이벤트)
└── css/
    └── style.css    # 전체 스타일 (reset + layout + components)
```

---

## 실행 방법

별도 설치 없이 `index.html` 파일을 브라우저에서 열면 바로 사용할 수 있습니다.

```bash
# VS Code Live Server 사용 시
# index.html 우클릭 → Open with Live Server

# 또는 Python 로컬 서버
python -m http.server 5500
# 브라우저에서 http://localhost:5500 접속
```
