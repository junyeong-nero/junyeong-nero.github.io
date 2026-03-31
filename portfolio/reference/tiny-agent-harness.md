# 1. 프로젝트 개요 (Project Overview)
----
- **프로젝트 명칭**: tiny-agent-harness
- **프로젝트 개요**: OpenAI Codex CLI, Anthropic Claude Code 같은 도구에서 보이는 **supervisor 중심 멀티에이전트 하니스 구조**를 작은 코드베이스로 재구성한 토이 프로젝트. planner, worker, reviewer, tool caller, channel/event 흐름을 노출해 구조를 읽고 실험하기 쉽게 설계함.
- **진행 기간 및 인원**: 2026.03 (개인 프로젝트)
- **사용 기술**: Python, Pydantic, OpenAI API, OpenRouter, PyYAML, pytest

## 2. 주요 기능 (Key Features)
---
- **Supervisor-led Multi-Agent Loop**
    - 고정된 `planner -> worker -> reviewer` 순차 체인이 아니라, supervisor가 다음 서브에이전트를 동적으로 선택
    - 동일 역할을 여러 번 다시 호출할 수 있어 실제 코딩 에이전트 제품의 흐름과 유사한 구조를 재현
- **명시적인 역할/권한 분리**
    - planner는 읽기 중심 분석, worker는 수정/실행, reviewer는 검증에 집중
    - 역할별 입력/출력 스키마와 허용 툴을 분리해 구조를 추적하기 쉽게 만듦
- **YAML 기반 런타임 설정**
    - provider, 역할별 모델, retry 제한, 허용 툴을 설정 파일로 제어
    - OpenAI와 OpenRouter 구성을 쉽게 바꿔가며 실험 가능
- **채널 기반 이벤트 시스템**
    - `run_started`, `tool_call_finished`, `run_result` 등 런타임 이벤트를 listener/output 채널로 분리
    - CLI 출력과 외부 로깅/관찰 로직을 느슨하게 결합

## 3. 기술 스택 및 선정 이유 (Tech Stack & Decision)
---
- **Python**
    - 에이전트 루프, 툴 호출, 설정 로딩을 빠르게 실험하고 작은 라이브러리 형태로 패키징하기 적합
- **Pydantic**
    - supervisor/planner/worker/reviewer의 구조화된 입출력을 강제해 역할 경계를 명확하게 유지
- **PyYAML**
    - 역할별 모델/툴 설정을 코드 변경 없이 조정할 수 있어 아키텍처 실험 속도를 높임
- **pytest**
    - CLI와 각 에이전트의 핵심 동작을 회귀 테스트로 보호

## 4. 문제의식과 배운 점 (Challenges & Learnings)
---
- **문제의식**
    - 많은 에이전트형 코딩 도구는 오케스트레이션이 프레임워크 내부에 감춰져 있어, 실제 제어 루프와 툴 경계를 파악하기 어려움
- **접근 방식**
    - planner, worker, reviewer, supervisor를 분리하고, 이벤트 채널과 툴 호출을 모두 노출하는 방식으로 구조를 단순화
- **배운 점**
    - 에이전트 시스템의 신뢰성은 모델 성능만이 아니라 구조화된 출력, 권한 경계, 이벤트 가시성 같은 설계 결정에 크게 좌우됨
