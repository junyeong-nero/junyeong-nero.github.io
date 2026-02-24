# 1. 프로젝트 개요 (Overview)
---
- **프로젝트 명칭**: tiny-graph-RAG
- **프로젝트 개요**: 비정형 텍스트 문서로부터 엔티티(Entity)와 관계(Relation)를 추출하여 지식 그래프(Knowledge Graph)를 구축하고, 이를 기반으로 정교한 문맥 검색을 수행하는 **Graph-based RAG 시스템** 개발. 기존 벡터 검색의 한계를 넘어 엔티티 간의 관계적 맥락을 반영한 답변 생성 파이프라인 구현.
- **진행 기간 및 인원**: 2025.12 - 2026.01 (1인 프로젝트)
- **사용 기술**: Python, OpenAI API, PyVis, NetworkX, Streamlit

## 2. 문제 정의 및 목표 (Problem Statement)
---
- **배경**:
    - 기존 벡터 검색(Vector Search)은 키워드 매칭이나 단순 의미 유사도에 의존하여, 인물·사건·개념 간의 복잡한 **관계 구조(Relationship Structure)** 를 파악하는 데 한계 존재
    - 문서 내 정보가 파편화되어 있을 경우, 이를 연결하여 종합적인 추론을 내리기 어려움
- **목표**:
    - 외부 라이브러리(LangChain Graph 등) 의존 없이 **Graph RAG의 핵심 로직을 직접 구현(Native Implementation)** 하여 원천 기술 확보
    - 문서에서 지식 그래프를 자동 생성하고, 질의와 관련된 최적의 서브그래프(Subgraph)를 탐색/랭킹하는 경량화된 파이프라인 구축

## 3. 주요 기능 및 기여 (Key Features & Contributions)
---
- **지식 그래프 구축 파이프라인 (Graph Construction)**
    - **Extraction Engine**: LLM을 활용해 비정형 텍스트에서 Node(엔티티)와 Edge(관계)를 정형화된 JSON 포맷으로 추출하는 파서 개발
    - **Data Modeling**: Custom Graph Class를 설계하여 메모리 상에서 그래프 구조를 효율적으로 관리하고 JSON 기반으로 영구 저장(Persistence)
- **검색 및 랭킹 알고리즘 (Retrieval & Ranking)**
    - **Graph Traversal**: 사용자 질의와 연관된 엔티티를 시작점(Seed Node)으로 하여 BFS(너비 우선 탐색) 기반으로 관련 지식을 확장 탐색
    - **Subgraph Scoring**: 탐색된 서브그래프 내에서 질의와의 연관성, 연결 중심성(Centrality) 등을 종합하여 문맥의 우선순위를 산출하는 랭킹 로직 구현
- **시각화 및 인터페이스 (Visualization)**
    - **Interactive UI**: Streamlit과 PyVis를 연동하여 구축된 지식 그래프를 시각적으로 탐색하고, RAG 답변 생성 과정을 실시간으로 모니터링할 수 있는 대시보드 제공

## 4. 기술적 난관 및 해결 (Troubleshooting)
---
- **LLM 호출 병목 및 속도 최적화**
    - **문제**: 긴 문서를 청킹(Chunking)하여 처리할 때 순차적 API 호출로 인해 그래프 구축 시간이 선형적으로 증가
    - **해결**: `asyncio` 기반의 **비동기 배치(Batch) 처리** 파이프라인을 도입하여 엔티티 추출 속도를 획기적으로 단축
- **Entity Resolution (동일 개체 식별 문제)**
    - **문제**: '김첨지', '김씨', '남편' 등 동일 인물이 서로 다른 텍스트로 추출되어 중복 노드가 생성되고 그래프 연결성이 저하됨
    - **해결**:
        - **Hybrid ER Strategy**: 규칙 기반(Rule-based) 병합과 LLM 기반의 의미론적(Semantic) 병합을 결합한 **Entity Resolution** 모듈 개발
        - **Confidence Threshold**: 유사도 신뢰도가 0.75 이상일 경우에만 병합하고, `MARRIED_TO`, `PARENT_OF` 등 상충되는 관계가 없을 때만 통합하는 안전장치 마련
    - **결과**: 중복 노드를 약 70% 감소(50개 → 15개)시켜 그래프의 밀도(Density)와 검색 정확도 향상

## 5. 성과 및 회고 (Results & Lessons Learned)
---
- **성과**
    - **End-to-End 자체 구현**: 데이터 전처리부터 그래프 구축, 검색, 생성에 이르는 RAG 전 과정을 외부 의존성 없이 밑바닥부터 구현하여 기술 내재화
    - **데이터 품질 개선**: 고도화된 ER 로직을 통해 노이즈를 제거하고 실질적인 관계 정보를 보존하는 고품질 지식 그래프 확보
- **인사이트**
    - **Graph RAG의 효용성**: 단순 텍스트 검색으로는 놓치기 쉬운 '숨겨진 관계'를 파악하는 데 그래프 구조가 강력한 도구임을 체감
    - **전처리 중요성 재확인**: 쓰레기 데이터(Garbage In)가 들어가면 그래프 전체가 오염되므로, **Entity Resolution**과 같은 정제 과정이 RAG 성능의 핵심임을 학습