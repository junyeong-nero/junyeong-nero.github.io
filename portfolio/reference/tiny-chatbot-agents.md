# 1. 프로젝트 개요 (Project Overview)
----
- **프로젝트 명칭**: tiny-chatbot-agents
- **프로젝트 개요**: 금융 서비스의 이용약관(ToS)과 자주 묻는 질문(FAQ) 데이터를 기반으로 정확도 높은 응답을 제공하는 **금융 도메인 특화 RAG 에이전트** 개발. **"QnA 우선 검색 + 약관 정밀 검색"** 의 이중 구조(Dual-Stage) 파이프라인을 구축하여 속도와 정확성을 동시에 확보함.
- **진행 기간 및 인원**: 2026.01 - 2026.02 (1개월, 1인 개발)
- **사용 기술**: Python, Streamlit, vLLM, Ollama, Playwright, ChromaDB

## 2. 주요 기능 (Key Features)
---
- **이중 단계 RAG 파이프라인 (Dual-Stage RAG Architecture)**
    - **Stage 1 (Fast Retrieval)**: 사전 구축된 FAQ DB를 우선 검색하여 일반적인 질의에 대해 즉각적인 응답 제공
    - **Stage 2 (Deep Retrieval)**: FAQ 매칭 실패 시, 이용약관(ToS) 전문 DB로 전환하여 복잡한 조항이나 세부 규정을 정밀 검색하는 계층적 구조 설계
- **하이브리드 검색 및 정밀 리랭킹 (Hybrid Search & Reranking)**
    - **Multi-Search Strategy**: 단순 의미 검색(Vector Search)의 한계를 보완하기 위해 키워드 매칭(Sparse)과 메타데이터 필터링을 결합한 하이브리드 검색 구현
    - **Cross-Encoder Reranking**: 1차 검색된 후보 문서들을 질의와의 연관성 기준으로 재정렬(Re-ranking)하여 최종 문맥의 정확도 극대화
- **답변 검증 에이전트 (Hallucination Verifier)**
    - **Self-Correction**: LLM이 생성한 답변이 검색된 문서(Context)에 기반하고 있는지 스스로 검증하는 로직 탑재
    - 근거 없는 정보(Hallucination)를 사전에 탐지하여 오안내 가능성을 원천 차단
- **Automated Evaluation System (LLM Judge)**
    - **정량적 평가**: 정확성(Accuracy), 충실성(Faithfulness), 완전성(Completeness) 지표를 정의하고 LLM Judge를 통해 자동 채점
    - **Adversarial Testing**: 프롬프트 인젝션(Prompt Injection) 및 도메인 무관 질문(Off-topic) 등 보안 위협 시나리오를 포함한 평가셋 구축

## 3. 기술 스택 및 선정 이유 (Tech Stack & Decision)
---
- **Playwright**
    - **선정 이유**: 금융사 웹페이지의 동적 렌더링(CSR, SPA) 환경에서도 데이터 누락 없이 약관 및 공지사항을 수집하기 위해 Selenium 대비 가볍고 빠른 Playwright 채택
- **ChromaDB**
    - **선정 이유**: 별도 서버 구축 없이 로컬 환경에서 임베딩과 메타데이터를 효율적으로 관리할 수 있으며, Python 생태계와의 호환성이 뛰어남
- **Dual-Stage Strategy**
    - **설계 의도**: 사용자 질의의 80%는 FAQ로 해결 가능하고, 나머지 20%만이 약관 참조가 필요하다는 파레토 법칙에 착안하여 시스템 리소스 효율화 및 응답 속도 최적화
- **Cross-Encoder**
    - **도입 배경**: '해지' vs '철회' 등 금융 용어의 미세한 뉘앙스 차이가 법적 효력을 가르므로, 단순 벡터 유사도보다 정밀한 문맥 파악이 가능한 Cross-Encoder 모델 도입

## 5. 핵심 트러블 슈팅 및 문제 해결 (Key Challenges & Solutions)
---
- **문제 (Problem)**
    - **용어 불일치**: 사용자가 '환불'로 검색했으나 약관에는 '청약 철회'로 명시되어 있어 검색에 실패하는 Semantic Gap 발생
    - **문맥 혼동**: '일반 해지'와 '직권 해지' 등 유사한 주제의 조항이 혼재되어 엉뚱한 조항을 참조하는 오류 발생
- **해결 (Solution)**
    - **Hybrid Search 가중치 조절**: 벡터 검색(의미)과 키워드 검색(용어)의 점수를 가중 합산하여 상호 보완
    - **Reranking 도입**: Cross-Encoder를 통해 1차 검색된 Top-k 문서와 질의 간의 논리적 연관성을 정밀 재채점하여 순위 조정
- **성과 (Result)**
    - 단순 벡터 검색 대비 **Top-5 Recall(재현율) 약 20% 향상** 및 답변 정확도 개선

## 6. 성과 및 배운 점 (Results & Lessons Learned)
---
- **고신뢰성 RAG 파이프라인 구현**
    - 단순 검색-생성(Retrieve-Generate)을 넘어 **검색-검증-평가**로 이어지는 전체 엔지니어링 사이클을 구축하여, 금융 도메인에서 필수적인 데이터 신뢰성 확보
- **MCP (Model Context Protocol) 기반 확장성 확보**
    - 최신 MCP 표준을 적용하여 LLM이 필요에 따라 검색 도구(Tool)를 자율적으로 호출하는 **Agentic Workflow** 구현
- **Data-Centric 개발 방법론 체득**
    - 정성적 눈대중이 아닌, 평가 데이터셋(Evaluation Set) 구축과 자동화된 지표 측정을 통해 코드 변경의 영향을 수치적으로 검증하는 프로세스 정립