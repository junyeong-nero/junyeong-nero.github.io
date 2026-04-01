// Language Toggle Script (Shared)
(function () {
    var translations = {
        ko: {
            // Section titles (main page)
            'section.education': '학력',
            'section.research': '관심 분야',
            'section.publications': '논문',
            'section.experiences': '경험',
            'section.projects': '프로젝트',
            'section.awards': '수상 및 기타 활동',
            'section.links': '외부 링크',

            // Education
            'edu.unist': 'UNIST (울산과학기술원)',
            'edu.unist.major': '컴퓨터공학과',
            'edu.military': '군 복무',
            'edu.military.desc': '현역 복무',
            'edu.highschool': '대구일과학고등학교',
            'edu.highschool.major': '물리 · 컴퓨터과학',

            // Research tags
            'tag.synth': '합성 데이터 생성',
            'tag.cv': '컴퓨터 비전',
            'tag.vllm': '비전 LLM',
            'tag.diffusion': '확산 모델',
            'tag.hci': 'Human-Computer Interaction',

            // Publications
            'pub.kormedmcqa.desc': '한국 의료 전문 자격시험을 위한 다지선다형 질의응답 벤치마크',

            // Experiences
            'exp.group.internships': '인턴십',
            'exp.group.startups': '스타트업',
            'exp.role.cj': 'AI/ML 인턴',
            'exp.role.embedded': '연구 인턴',
            'exp.role.troja': '풀스택 개발자',
            'exp.cj.desc': 'LangChain 기반 멀티에이전트 파이프라인으로 한국 드라마 대본 분석 시스템을 개발했습니다.',
            'exp.embedded.desc': '확산 모델의 추론 단계를 더 효율적으로 만드는 최적화 기법을 연구했습니다.',
            'exp.troja.desc': '초기 스타트업에서 딥페이크 방어 백엔드와 MVP 웹페이지 구축을 담당했습니다.',

            // Tab buttons
            'tab.llm': 'LLM 시스템',
            'tab.generative': '생성형 AI',
            'tab.vision': '비전 & 응용 ML',
            'tab.applications': '애플리케이션',

            // Project card subtitles
            'card.llmmafia': '멀티에이전트 소셜 디덕션 시뮬레이터',
            'card.harness': 'Codex·Claude Code 스타일 에이전트 하니스',
            'card.chatbot': '이중 단계 금융 RAG 에이전트',
            'card.sd': '처음부터 구현한 SD3 스타일 파이프라인',
            'card.ocr': 'OCR용 합성 벤치마크',
            'card.graphrag': '지식 그래프 검색 시스템',
            'card.medimg': 'MedViT-V2 기반',
            'card.drama': '멀티에이전트 기반',
            'card.dfdefense': '방어 모델용 클라우드 서빙',
            'card.medllm': '한국어 의료 특화 LLM',
            'card.gomoku': 'MCP 기반 오목 서버 · AI vs AI',
            'card.ddpm': 'DDPM, DDIM, CFG 직접 구현',
            'card.bilingual': '제주 방언↔표준 한국어 번역',
            'card.pomodoro': '웹·모바일 집중 타이머',
            'card.delivery': '배달 기사용 출입 정보 공유 도구',
            'card.studywithme': '학원용 학생 관리 앱',

            // Awards
            'award.awards': '수상',
            'award.awards.desc': 'UNIST에 수석 입학하여 Unistar 장학생으로 선발되었습니다.',
            'award.teaching': '교육',
            'award.teaching.desc': 'AI 개론과 프로그래밍 1 과목에서 조교로 활동했습니다.',

            // Footer & Navigation
            'footer.rights': '© 2026 송준영. All rights reserved.',
            'hero.intro': 'AI 시스템을 직접 뜯어보고 다시 만들면서 연구와 프로덕트 사이를 잇고 있어요.',
            'hero.caption': 'UNIST · 컴퓨터공학과',
            'hero.vision': '안녕하세요, 제 이름은 송준영입니다.<br><br>저는 AI 도구를 그냥 쓰는 데서 멈추지 않고, 직접 다시 만들어봐요. 처음부터 최소한의 버전으로 구현해보는 이유는, 어디서 부서지는지 직접 봐야 고칠 수 있다고 믿기 때문이에요.<br><br>요즘은 에이전트 시스템에 가장 빠져 있어요. LLM이 어떻게 추론하고, 계획하고, 협력하는지 — 그리고 논문에서 통하는 것과 실제 환경에서 버티는 것 사이의 간극이 궁금해요.<br><br>작게 만든 프로토타입이 논문이 못 가르쳐준 걸 알려줄 때가 제일 재밌어요. 작게 만들고, 빠르게 배우고, 그다음 진짜로 만드는 것 — 그게 제 방식이에요.',
            'nav.back': '← 포트폴리오로 돌아가기',
            'doc.title': '송준영 | 포트폴리오',

            // Common project section headers
            'proj.overview': '📋 프로젝트 개요',
            'proj.problem': '🎯 문제 정의 및 목표',
            'proj.features': '⚙️ 주요 기능 및 기여',
            'proj.challenges': '🔧 기술적 과제와 해결 방식',
            'proj.results': '📈 결과 및 배운 점',
            'proj.tech': '🛠️ 기술 스택',
            'proj.links': '🔗 링크',
            'proj.simple.overview': '📋 개요',
            'proj.simple.features': '⚡ 주요 기능',
            'proj.simple.achievements': '⚡ 주요 성과',
            'proj.simple.projects': '🚀 프로젝트',
            'proj.simple.contributions': '⚡ 주요 기여',
            'proj.professional': '📚 실무적으로 얻은 것',

            // Korean Medical LLM
            'medllm.overview': '한국어 의료 데이터 부족 문제를 풀기 위해 약 44만 9,500건 규모의 도메인 데이터셋을 구축하고, `google/gemma2-9b` 기반 SFT와 모델 병합을 적용해 한국어 의료 특화 LLM을 개발했습니다.',
            'medllm.problem': '문제: 범용 LLM은 의료 질문에서 환각이 발생하기 쉽고, 한국어 의학 용어 이해도도 충분하지 않아 신뢰가 중요한 의료 환경에 바로 쓰기 어렵습니다.',
            'medllm.goal1': '목표 1: 국가고시, 질병사전, 의료 법률 문서처럼 신뢰할 수 있는 출처를 바탕으로 한국어 의료 데이터셋을 구축합니다.',
            'medllm.goal2': '목표 2: SFT와 모델 병합을 통해 의료 전문성을 높이면서도 일반적인 추론 능력은 최대한 유지합니다.',
            'medllm.goal3': '목표 3: 한국어 의료 질의응답에 실제로 활용할 수 있는 특화 LLM 파이프라인을 완성합니다.',
            'medllm.feat1': '하이브리드 데이터셋 설계: KorMedMCQA, 아산병원 질병사전, 번역한 MedExpQA/UltraMed, 의료 법률 기반 합성 QA를 포함해 449,500건의 학습 데이터를 구성했습니다.',
            'medllm.feat2': '최신성 보강: 2025년도 의사국가고시 문항을 새로 라벨링해 데이터의 시의성을 높였습니다.',
            'medllm.feat3': '데이터 중심 접근: 의료 전문가의 직접 라벨링이 어려운 상황에서, 공신력 있는 기관 데이터와 고품질 번역 데이터를 조합해 도메인 지식을 보강했습니다.',
            'medllm.feat4': 'Instruction Tuning 최적화: 단순 텍스트가 아니라 QA/대화 형식 중심으로 데이터를 설계해 지시 이행 능력을 높였습니다.',
            'medllm.chal1': 'Catastrophic Forgetting: 의료 데이터 비중이 지나치게 높아지면 일반 상식과 범용 추론 성능이 눈에 띄게 떨어졌습니다.',
            'medllm.chal2': '혼합 비율 탐색: 선행연구와 반복 실험을 바탕으로 한국어:영어 60:40 비율이 가장 안정적이라는 결론을 얻었습니다.',
            'medllm.chal3': '도메인-범용 균형: General:Medical 약 2.5:1 비율을 적용해 범용성과 전문성의 균형점을 맞췄습니다.',
            'medllm.chal4': '모델 병합 전략: SFT 모델과 범용 모델을 병합해 의료 성능은 유지하면서 일반 대화 품질 하락을 줄였습니다.',
            'medllm.result1': '성과: KorMedMCQA와 자체 구축 데이터를 바탕으로 한국어 의료 LLM 학습 파이프라인을 완성했습니다.',
            'medllm.result2': '성과: 데이터 혼합 비율과 모델 병합을 통해 도메인 성능과 범용성 사이의 트레이드오프를 효과적으로 조정했습니다.',
            'medllm.result3': '인사이트: 단순히 의료 데이터를 많이 넣는 것보다, 어떤 비율로 섞느냐가 성능에 더 큰 영향을 준다는 점을 확인했습니다.',
            'medllm.result4': '인사이트: 저자원 언어 의료 LLM에서는 고품질 번역 데이터와 합성 데이터 활용 전략이 특히 중요하다는 점을 확인했습니다.',

            // Deepfake Defense
            'dfdefense.overview': '딥페이크 생성 모델과 방어 모델을 함께 서빙하기 위해 NAVER Cloud Platform 위에 안정적인 백엔드 서버를 구축했습니다. 이 시스템은 `inswapper` 기반 생성 모델과 LEAT, DIPA 같은 방어 기법을 한 환경에서 검증할 수 있게 해줍니다.',
            'dfdefense.problem': '문제: 딥페이크는 개인 프라이버시와 정보 무결성을 크게 위협하지만, 많은 방어 기법은 연구 환경 안에서만 검증되어 실제 배포 관점의 테스트가 부족합니다.',
            'dfdefense.goal1': '목표 1: 생성 모델과 방어 모델을 모두 서비스할 수 있는 프로덕션 수준의 백엔드를 구축합니다.',
            'dfdefense.goal2': '목표 2: 무단 얼굴 스왑 공격으로부터 이미지를 보호하기 위해 LEAT 및 DIPA 방어 메커니즘을 구현합니다.',
            'dfdefense.goal3': '목표 3: 확장 가능하고 접근성 있는 방어 전략 테스트 환경을 클라우드 위에 배포합니다.',
            'dfdefense.feat1': '딥페이크 생성 파이프라인: 방어 기법을 체계적으로 테스트하기 위해 `inswapper` 모델을 통합했습니다.',
            'dfdefense.feat2': 'LEAT 적용: 얼굴 스왑을 방해하는 미세한 섭동을 추가해 이미지를 보호하는 적대적 방어 기법을 배포했습니다.',
            'dfdefense.feat3': 'DIPA 통합: 시각적 품질은 유지하면서 딥페이크 생성을 방해하는 이미지 섭동 기법을 구현했습니다.',
            'dfdefense.feat4': '클라우드 아키텍처: NCP 위에서 Flask, uWSGI, Nginx를 조합해 확장 가능한 백엔드를 설계했습니다.',
            'dfdefense.feat5': 'API 설계: 이미지 업로드, 처리, 방어 적용을 위한 RESTful 엔드포인트를 구축했습니다.',
            'dfdefense.chal1': 'GPU 메모리 관리: 여러 딥러닝 모델을 동시에 운영해야 해서 GPU 메모리를 효율적으로 배분할 필요가 있었습니다. 이를 위해 모델 로딩/언로딩 전략과 배치 처리를 도입했습니다.',
            'dfdefense.chal2': '실시간 처리: 방어 기법이 빠르게 이미지를 처리해야 했기 때문에 PyTorch 최적화와 CUDA 가속으로 허용 가능한 지연 시간을 맞췄습니다.',
            'dfdefense.chal3': '모델 간 형식 차이: 방어 방식마다 입출력 형식이 달라 통합이 어려웠고, 이를 해결하기 위해 공통 전처리·후처리 파이프라인을 만들었습니다.',
            'dfdefense.chal4': '프로덕션 안정성: uWSGI 워커 관리, Nginx 로드밸런싱, 오류 처리를 정리해 서비스 안정성을 확보했습니다.',
            'dfdefense.result1': '성과: 생성 모델과 방어 모델을 모두 서빙하는 안정적인 프로덕션 환경을 구축했습니다.',
            'dfdefense.result2': '성과: LEAT와 DIPA는 95% 이상의 SSIM을 유지하면서 얼굴 스왑 시도를 효과적으로 방해했습니다.',
            'dfdefense.result3': '배운 점: 적대적 ML, 섭동 기반 방어, 그리고 딥러닝 모델의 실제 배포 과정에 대한 이해가 깊어졌습니다.',
            'dfdefense.result4': '배운 점: 클라우드 배포, 컨테이너화, 확장 가능한 ML 서빙 인프라 설계 역량을 쌓았습니다.',

            // Bilingual Translation LLM
            'bilingual.overview': '제주 방언과 표준 한국어를 양방향으로 번역하기 위해 KoT5/KoBART 기반 인코더-디코더 모델을 구축하고, PEFT(LoRA, QLoRA)를 적용해 저자원 환경에서도 성능을 확보한 프로젝트입니다.',
            'bilingual.problem': '문제: 번역 과제에서는 인코더-디코더 구조가 여전히 강점이 있지만, 제한된 GPU 환경에서 고품질 방언 번역 모델을 학습하면서 뉘앙스까지 살리기는 쉽지 않습니다.',
            'bilingual.goal1': '목표 1: 단일 모델로 제주 방언↔표준어 양방향 번역이 가능한 통합 파이프라인을 구축합니다.',
            'bilingual.goal2': '목표 2: Full Fine-tuning, LoRA, QLoRA를 비교해 성능과 자원 효율의 균형점을 찾습니다.',
            'bilingual.goal3': '목표 3: 제한된 리소스에서도 실무 적용 가능한 정량 성능을 확보합니다.',
            'bilingual.feat1': '데이터셋 엔지니어링: AIHub 제주 방언 데이터를 정제해 453k 병렬 페어를 구축하고, 표준어와 방언이 완전히 같은 샘플은 제거해 학습 신호 밀도를 높였습니다.',
            'bilingual.feat2': '멀티태스크 학습: `<dialect_to_standard>`, `<standard_to_dialect>` 스페셜 토큰을 도입해 하나의 모델로 양방향 번역을 구현했습니다.',
            'bilingual.feat3': '학습 파이프라인: Seq2SeqTrainer 기반으로 Full/LoRA/QLoRA 실험을 체계적으로 수행했습니다.',
            'bilingual.feat4': '정량 평가: BLEU와 ROUGE-L을 기준으로 모델 품질을 비교 검증했습니다.',
            'bilingual.feat5': '최종 성능: BLEU 0.56, ROUGE-L 0.60을 달성해 안정적인 번역 품질을 확인했습니다.',
            'bilingual.chal1': 'OOM 이슈: Colab T4(16GB) 환경에서 Full Fine-tuning 중 Optimizer 상태 메모리로 OOM이 반복 발생했습니다.',
            'bilingual.chal2': '메모리 최적화: QLoRA 4-bit 양자화를 적용해 메모리 사용량을 크게 줄이면서 성능 저하를 최소화했습니다.',
            'bilingual.chal3': '성능 검증: 추가 리소스 환경에서 Full 모델과 QLoRA 모델을 비교해 성능-효율 트레이드오프를 분석했습니다.',
            'bilingual.chal4': '검증 결과: QLoRA가 낮은 메모리 점유율에서도 Full Fine-tuning에 준하는 성능을 유지함을 확인했습니다.',
            'bilingual.result1': '성과: 태그 기반 프롬프팅으로 단일 모델 양방향 번역 시스템을 안정적으로 구현했습니다.',
            'bilingual.result2': '성과: 저사양 GPU 환경에서도 QLoRA 기반으로 실사용 가능한 수준의 번역 모델을 구축할 수 있음을 확인했습니다.',
            'bilingual.result3': '인사이트: 번역 중심 과제에서는 인코더-디코더 아키텍처의 구조적 강점이 여전히 유효하다는 점을 다시 확인했습니다.',
            'bilingual.result4': '향후 계획: 동일 파라미터 규모의 Decoder-only 모델과 정량 비교해 아키텍처 효율을 추가 분석할 예정입니다.',

            // tiny-DDPM
            'ddpm.overview': 'DDPM의 핵심 메커니즘을 처음부터 직접 구현해 생성 모델의 작동 원리를 코드 수준에서 검증하고, MNIST 생성 품질을 정량 지표로 최적화한 프로젝트입니다.',
            'ddpm.problem': '문제: 최신 확산 모델의 수식과 아키텍처를 라이브러리 추상화에 가리지 않고 직접 구현하며 이해할 필요가 있었습니다.',
            'ddpm.goal1': '목표 1: Ho et al. (2020) 논문의 수식을 코드로 정확히 옮기는 구현 역량을 확보합니다.',
            'ddpm.goal2': '목표 2: DDIM, CFG를 추가 구현해 생성 속도와 품질을 동시에 개선합니다.',
            'ddpm.goal3': '목표 3: FID/IS 기반 정량 평가 체계를 구축해 하이퍼파라미터 영향을 검증합니다.',
            'ddpm.feat1': 'Noise Scheduling 구현: 선형/코사인 스케줄러와 Forward/Reverse Diffusion 로직을 직접 설계했습니다.',
            'ddpm.feat2': 'Custom U-Net 설계: ResNet 기반 다운/업샘플링과 Residual Connection, Conditioning 강화를 위한 Attention 구조를 적용했습니다.',
            'ddpm.feat3': '고급 샘플링: Non-Markovian DDIM과 Classifier-Free Guidance를 구현해 추론 효율을 높였습니다.',
            'ddpm.feat4': '정량 평가: FID와 IS로 생성 품질을 수치화하고 Guidance Scale별 성능을 비교했습니다.',
            'ddpm.feat5': '최적 지점 확인: CFG Scale w=0.1에서 FID 0.2514를 기록해 최고 성능을 확인했습니다.',
            'ddpm.chal1': '조건 신호 간섭: Time Embedding과 Class Embedding을 단순 합산했을 때 특정 숫자가 생성되지 않는 Mode Collapse가 발생했습니다.',
            'ddpm.chal2': '원인 분석: 시간 정보와 클래스 정보가 동일 채널로 주입되어 정보 간섭이 발생했습니다.',
            'ddpm.chal3': '해결: Time/Class 경로를 분리하고 U-Net Bottleneck에 Cross-Attention 레이어를 도입해 조건 정보를 명확히 반영했습니다.',
            'ddpm.chal4': '결과: 조건 정보 간섭이 해소되어 0~9 조건부 숫자를 안정적으로 생성하는 모델 학습에 성공했습니다.',
            'ddpm.result1': '성과: DDPM, DDIM, CFG를 포함한 End-to-End 생성 파이프라인을 자체 구현했습니다.',
            'ddpm.result2': '성과: FID 0.2514를 포함한 정량 지표로 성능을 검증하고, Guidance Scale의 영향을 실험적으로 확인했습니다.',
            'ddpm.result3': '배운 점: 단순 재현을 넘어서 Attention 추가 같은 구조 개선까지 시도하며 아키텍처 엔지니어링 감각을 키웠습니다.',
            'ddpm.result4': '배운 점: 실험 설정과 결과 기록의 중요성을 체감하며 체계적인 실험 관리 프로세스를 정립했습니다.',

            // tiny-stable-diffusion
            'sd.overview': 'Stable Diffusion 3(SD3) 계열 아키텍처를 처음부터 구현해 64x64 텍스트-이미지 생성 모델을 구축한 프로젝트입니다. U-Net이 아니라 Transformer 기반 MMDiT 구조를 직접 설계했습니다.',
            'sd.problem': '문제: MNIST 기반 Diffusion 프로젝트의 한계를 넘어 Latent Diffusion과 Text Conditioning을 실제 코드로 구현하고 검증할 필요가 있었습니다.',
            'sd.goal1': '목표 1: SD3 핵심 구조인 MMDiT + VAE 아키텍처를 자체 구현합니다.',
            'sd.goal2': '목표 2: 텍스트 프롬프트 입력부터 64x64 RGB 이미지 생성까지 이어지는 end-to-end 학습/평가 파이프라인을 구축합니다.',
            'sd.goal3': '목표 3: FID, CLIPScore 등 정량 지표 기반으로 모델 품질을 객관적으로 검증합니다.',
            'sd.feat1': 'MMDiT 구현: Transformer 백본과 Joint Attention으로 이미지-텍스트 간 상호작용을 학습했습니다.',
            'sd.feat2': 'Conditioning 설계: CLIP-L 텍스트 인코더와 adaLN-zero를 적용해 Time/Text 임베딩 주입 구조를 안정화했습니다.',
            'sd.feat3': 'Rectified Flow + VAE: Rectified Flow와 beta-VAE를 적용해 잠재 공간 학습 효율을 높이고 VAE MSE 0.0002를 달성했습니다.',
            'sd.feat4': '대규모 학습 인프라: LAION/CC3M 데이터 전략, Hugging Face Streaming, W&B + RunPod(A4500) 모니터링 체계를 구축했습니다.',
            'sd.feat5': '정량 평가 체계: FID, CLIP-FID, IS, CLIPScore, PSNR, MSE를 포함한 다각도 평가 파이프라인을 구현했습니다.',
            'sd.chal1': 'Prompt Overfitting: 소규모 데이터셋(30k)에서는 프롬프트와 무관한 패턴 반복 생성이 발생했습니다.',
            'sd.chal2': '일반화 개선: 학습 데이터를 CC3M(3M)으로 확장하고 VAE:Diffusion 데이터 비율을 조정해 과적합을 완화했습니다.',
            'sd.chal3': '수렴 지연: Diffusion 학습이 느리고 불안정해 장기 학습에서 손실 감소가 더뎠습니다.',
            'sd.chal4': '학습 안정화: Logit-normal sampling, Min-SNR weighting, Checkpoint/Resume를 도입해 학습 안정성과 지속 가능성을 높였습니다.',
            'sd.result1': '성과: MMDiT와 Rectified Flow를 포함한 SD3 핵심 요소를 직접 구현한 텍스트 조건부 생성 모델을 완성했습니다.',
            'sd.result2': '성과: 눈대중 평가가 아니라 정량 지표로 모델을 검증하는 체계를 구축했습니다.',
            'sd.result3': '성과: 64x64 해상도의 텍스트-이미지 생성 파이프라인을 end-to-end로 완성했습니다.',
            'sd.result4': '배운 점: 최신 아키텍처 구현, 데이터 전략 설계, 제한된 자원 안에서의 학습 운영 역량을 함께 키울 수 있었습니다.',

            // Drama Analysis Pipeline
            'drama.confidential': '🔒 사내 프로젝트 — 소스 코드 및 세부 산출물은 비공개입니다. 이 페이지의 수치와 구조는 인턴 재직 당시의 개인 기록을 바탕으로 작성되었습니다.',
            'drama.overview': '드라마 대본의 줄거리·캐릭터 매력도·흥행 요소를 정량적으로 분석해 제작 의사결정을 지원하는 Multi-Agent 파이프라인을 구축한 프로젝트입니다. 4인 팀으로 진행했으며, alpha-beta-gamma 테스트 기간 중 실제 대본 검토 업무에 투입됐습니다.',
            'drama.problem': '문제: 1~4화 분량 대본을 인력이 직접 검토하는 기존 프로세스는 시간·비용이 크고, 검토자 편향으로 평가 일관성이 낮았습니다. 물리적 한계로 가치 있는 작품이 누락될 위험도 있었습니다.',
            'drama.goal1': '목표 1: Multi-Agent 시스템으로 대본 분석을 자동화하고 객관적 평가 지표를 제공합니다.',
            'drama.goal2': '목표 2: PDF/HWP/DOCX 등 다양한 포맷을 높은 한국어 정확도로 안정적으로 파싱합니다.',
            'drama.goal3': '목표 3: OCR 품질(WER)과 씬 분류 성능(F1)을 실무 적용 가능한 수준으로 정량 개선합니다.',
            'drama.feat1': 'Multi-Format Document Parser: PDF·HWP·DOCX를 정형 텍스트로 변환하는 전처리 모듈을 개발하고, 한국어 OCR 벤치마크 데이터셋으로 성능을 검증했습니다.',
            'drama.feat2': 'VLM 도입 (Qwen2.5-7B-VL): 기존 OCR의 한국어 인식 한계와 다단 레이아웃 정렬 오류를 극복하기 위해 시각 구조를 이해하는 VLM을 적용했습니다.',
            'drama.feat3': 'Scene Analysis Agent: 씬 단위 강점/약점 분류 에이전트에 CoT 프롬프팅을 결합해 한국어 구어체의 미묘한 뉘앙스까지 추론하도록 설계했습니다.',
            'drama.feat4': 'AWS On-Demand GPU 배포: boto3로 필요한 시점에만 GPU EC2를 생성하고, 사전 초기화된 EBS volume mount·AMI·startup script를 조합해 cold start를 최소화하면서 유휴 GPU 비용을 제거했습니다.',
            'drama.feat5': 'LangChain 오케스트레이션: Parser·Analyzer·Evaluator 에이전트를 상태 기반 워크플로우와 조건부 병렬 실행으로 연결했습니다.',
            'drama.chal1': 'OCR 한계 — WER 20% 이상: PaddleOCR 등 기존 OCR은 한국어 인식률이 낮고, 다단 레이아웃에서 텍스트 순서가 뒤섞이는 정렬 오류가 빈번했습니다.',
            'drama.chal2': '해결: 문서 시각 구조를 이해하는 Qwen2.5-7B-VL로 전환해 WER를 20%에서 7%로 대폭 낮췄습니다.',
            'drama.chal3': '씬 분류 성능 — F1 0.2: 데이터 부족과 장르별 과도한 프롬프트 세분화로 모델이 표면 패턴에 과적합돼 F1이 0.2에 머물렀습니다.',
            'drama.chal4': '해결: 한국어 추론 능력이 높은 모델(Deepseek-R1, c4ai-command-a 등)을 벤치마킹하고 프롬프트를 단순화해 모델 자체 추론에 맡김으로써 F1을 0.5로 개선했습니다.',
            'drama.chal5': 'AWS Cold Start & 비용: S3에서 매번 weight를 받는 구조는 cold start가 20~30분에 달했습니다. 사전 초기화된 EBS volume, AMI 스냅샷, uv 기반 환경 구성으로 기동 시간을 단축하고 리전별 GPU 가용성을 고려한 capacity-aware 리전 선택을 적용했습니다.',
            'drama.result1': 'OCR 정확도: VLM 기반 파싱으로 WER 20% → 7% 달성, 하위 에이전트에 신뢰도 높은 입력 데이터를 확보했습니다.',
            'drama.result2': '분류 성능: 모델 선정 및 프롬프트 단순화로 씬 단위 F1 스코어 0.2 → 0.5로 2.5배 향상됐습니다.',
            'drama.result3': '실제 운영: alpha-beta-gamma 테스트 기간 실제 검토 업무에 투입. On-Demand GPU 구조로 주기성 워크로드에 맞는 비용 효율적 운영 구조를 확보했습니다.',
            'drama.result4': '인사이트: 데이터 품질·단순한 프롬프트 설계·EBS mount 안정성·리전 GPU capacity 같은 인프라 세부 요소가 모델 성능만큼이나 실제 운영 가능성을 결정합니다.',

            // tiny-chatbot-agent
            'chatbot.overview': '금융 서비스 FAQ와 이용약관(ToS)을 바탕으로 정확한 답변을 제공하는 금융 도메인 특화 RAG 에이전트를 개발했습니다. FAQ 우선 검색과 약관 정밀 검색을 결합한 2단계 파이프라인으로 속도와 정확도를 함께 확보했습니다.',
            'chatbot.problem': '문제: 사용자 용어와 약관 용어 간 의미 간극, 유사 조항 혼동, 환각 응답으로 인해 금융 도메인 챗봇의 신뢰성과 검색 정확도가 낮았습니다.',
            'chatbot.goal1': '목표 1: FAQ 우선 검색 후 약관 심화 검색으로 이어지는 이중 단계 검색 구조를 구축합니다.',
            'chatbot.goal2': '목표 2: 하이브리드 검색과 Cross-Encoder 재랭킹으로 조항 단위 정밀 검색 성능을 높입니다.',
            'chatbot.goal3': '목표 3: 환각 검증과 자동 평가 체계를 도입해 답변 신뢰성을 정량 관리합니다.',
            'chatbot.feat1': 'Dual-Stage RAG: Stage 1에서 FAQ를 빠르게 검색하고, 실패 시 Stage 2에서 ToS 전문을 정밀 탐색합니다.',
            'chatbot.feat2': 'Hybrid Search + Reranking: 벡터/키워드/메타데이터 결합 검색과 Cross-Encoder 재정렬로 문맥 적합도를 개선했습니다.',
            'chatbot.feat3': 'Hallucination Verifier: 생성된 답변이 검색 근거에 실제로 기반하는지 스스로 점검하는 검증 에이전트를 구현했습니다.',
            'chatbot.feat4': 'LLM Judge 평가: Accuracy, Faithfulness, Completeness 지표와 적대적 시나리오를 포함한 자동 평가 파이프라인을 구축했습니다.',
            'chatbot.feat5': 'MCP 확장성: Model Context Protocol을 적용해 에이전트가 필요할 때 도구를 호출할 수 있는 워크플로우를 구현했습니다.',
            'chatbot.feat6': '로컬 추론 환경: vLLM/Ollama 기반으로 외부 전송 없이 동작 가능한 보안 친화형 구성을 완성했습니다.',
            'chatbot.chal1': '용어 불일치: 사용자 질문의 표현(예: 환불)과 약관 표현(예: 청약 철회)이 달라 검색 누락이 발생했습니다.',
            'chatbot.chal2': '문맥 혼동: 일반 해지와 직권 해지처럼 비슷한 조항이 섞여 잘못된 근거 문서가 선택되는 문제가 있었습니다.',
            'chatbot.chal3': '해결: 벡터/키워드 점수를 가중 합산하는 Hybrid Search와 Cross-Encoder 재랭킹을 도입했습니다.',
            'chatbot.chal4': '결과: 단순 벡터 검색 대비 Top-5 Recall을 약 20% 향상시키고 최종 답변 정확도를 개선했습니다.',
            'chatbot.result1': '성과: 단순한 Retrieve-Generate를 넘어 Retrieve-Verify-Evaluate 전체 사이클을 구축했습니다.',
            'chatbot.result2': '성과: Top-5 Recall 약 20% 개선과 함께 금융 도메인 질의 응답 신뢰도를 높였습니다.',
            'chatbot.result3': '성과: MCP 기반 구조로 향후 도구 확장과 에이전트 오케스트레이션 유연성을 확보했습니다.',
            'chatbot.result4': '배운 점: 평가셋과 자동 지표를 중심으로 품질을 관리하는 데이터 중심 개발 프로세스를 정착시켰습니다.',

            // tiny-graph-rag
            'graphrag.overview': '비정형 문서에서 엔티티와 관계를 추출해 지식 그래프를 만들고, 그 관계 맥락을 반영해 문맥 검색을 수행하는 그래프 기반 RAG 시스템을 직접 구현한 프로젝트입니다.',
            'graphrag.problem': '문제: 기존 벡터 검색은 의미 유사도 중심이라 인물·사건·개념 간 관계 구조를 반영한 추론에 한계가 있습니다.',
            'graphrag.goal1': '목표 1: 외부 그래프 프레임워크에 크게 의존하지 않고 Graph RAG 핵심 로직을 직접 구현합니다.',
            'graphrag.goal2': '목표 2: 문서로부터 지식 그래프를 자동 생성하고 질의별 최적 서브그래프를 탐색/랭킹합니다.',
            'graphrag.goal3': '목표 3: 관계 기반 문맥 검색으로 멀티홉 질의 응답 품질을 개선합니다.',
            'graphrag.feat1': '추출 엔진: LLM으로 노드와 엣지를 JSON 형태로 추출하는 파서를 개발했습니다.',
            'graphrag.feat2': '데이터 모델링: Custom Graph Class와 JSON persistence를 설계해 그래프 저장·재사용 구조를 구현했습니다.',
            'graphrag.feat3': '검색 및 랭킹: Seed Node 기반 BFS 탐색과 중심성/연관성 점수를 결합한 서브그래프 랭킹 로직을 구현했습니다.',
            'graphrag.feat4': '시각화: Streamlit + PyVis 대시보드로 그래프 탐색과 RAG 응답 과정을 실시간으로 확인할 수 있게 했습니다.',
            'graphrag.chal1': '호출 병목: 긴 문서를 청킹해 순차 호출할 때 그래프 구축 시간이 선형적으로 증가했습니다.',
            'graphrag.chal2': '속도 개선: asyncio 기반 비동기 배치 처리로 엔티티 추출 파이프라인 처리량을 높였습니다.',
            'graphrag.chal3': '동일 개체 중복: 김첨지/김씨/남편처럼 동일 인물이 중복 노드로 분리되어 연결성이 떨어졌습니다.',
            'graphrag.chal4': 'Entity Resolution: 규칙 기반 + LLM 기반 하이브리드 ER, 유사도 0.75 임계치, 관계 충돌 검사를 통해 중복 노드를 50개에서 15개로 줄였습니다.',
            'graphrag.result1': '성과: 전처리, 그래프 구축, 검색, 생성까지 Graph RAG 전 과정을 end-to-end로 직접 구현했습니다.',
            'graphrag.result2': '성과: ER 고도화로 중복 노드를 약 70% 줄여 그래프 밀도와 검색 정확도를 개선했습니다.',
            'graphrag.result3': '성과: 단순 텍스트 검색으로는 놓치기 쉬운 숨은 관계를 시각적으로 탐색하고 답변에 반영할 수 있었습니다.',
            'graphrag.result4': '배운 점: Graph RAG 성능은 모델 자체보다 Entity Resolution 같은 전처리 품질에 크게 좌우된다는 점을 확인했습니다.',

            // Medical Image Classification
            'medimg.overview': '맞춤형 CNN 아키텍처와 Vision Transformer(ViT)를 함께 탐색한 의료 이미지 분류 프로젝트입니다. X-ray 분류를 중심으로 데이터 증강과 클래스 불균형 대응 기법을 적용했습니다.',
            'medimg.problem': '문제: 의료 이미지 분류는 라벨이 부족하고 클래스가 불균형한 경우가 많으며, 진단에 활용하려면 높은 정확도도 요구됩니다.',
            'medimg.goal1': '목표 1: 의료 이미지 분류에 대해 CNN과 ViT 아키텍처를 비교 평가합니다.',
            'medimg.goal2': '목표 2: 제한된 라벨링 데이터를 보완할 수 있는 효과적인 데이터 증강 전략을 설계합니다.',
            'medimg.goal3': '목표 3: 의료 데이터셋에서 흔한 클래스 불균형 문제를 완화합니다.',
            'medimg.feat1': 'CNN 아키텍처: 의료 이미지에 맞춘 맞춤형 CNN을 설계하고 구현했습니다.',
            'medimg.feat2': 'ViT 탐색: Vision Transformer를 적용하고 CNN과 성능을 비교했습니다.',
            'medimg.feat3': '데이터 증강: 회전, 뒤집기, 밝기 조정 등 의료 이미지에 적합한 증강 기법을 구현했습니다.',
            'medimg.feat4': '불균형 처리: 가중치 손실 함수와 오버샘플링으로 클래스 불균형을 완화했습니다.',
            'medimg.chal1': '데이터 부족: 라벨링된 의료 이미지가 제한적이어서 데이터 증강과 전이 학습으로 이를 보완했습니다.',
            'medimg.chal2': '클래스 불균형: 일부 질병 클래스가 매우 희소해 가중치 손실과 오버샘플링을 적용했습니다.',
            'medimg.chal3': '모델 해석성: 의료 진단에서는 예측 근거가 중요하기 때문에 GradCAM으로 모델이 주목한 영역을 분석했습니다.',
            'medimg.chal4': '일반화 성능: 학습 데이터와 다른 도메인에서 성능이 떨어지는 문제를 줄이기 위해 다양한 데이터 소스와 정규화 기법을 적용했습니다.',
            'medimg.result1': '성과: CNN과 ViT 모두 높은 정확도를 기록했고, 일부 사례에서는 ViT가 더 좋은 성능을 보였습니다.',
            'medimg.result2': '성과: 데이터 증강 기법이 제한된 데이터 환경에서 성능 향상에 크게 기여했습니다.',
            'medimg.result3': '성과: GradCAM 시각화를 통해 모델이 적절한 병변 영역에 주목하고 있음을 확인했습니다.',
            'medimg.result4': '배운 점: 의료 영상 분석, 데이터 불균형 대응, 모델 해석성 측면의 실전 경험을 쌓았습니다.',

            // Synthetic OCR Image Generator
            'ocr.overview': '마크다운 중심 합성 OCR 데이터셋 생성 및 벤치마킹 툴킷입니다. LLM 기반 코퍼스 생성 → Headless Playwright 렌더링 → HuggingFace 퍼블리시 → 재현 가능한 OCR/VLM 모델 평가 → 리더보드까지 전 과정을 커버합니다. 한국어와 일본어를 지원합니다.',
            'ocr.problem': '문제: 한국어·일본어 OCR 고품질 라벨 데이터는 수집 비용이 높고, 텍스트·표·수식 영역을 동시에 공정하게 비교하는 재현 가능한 벤치마크가 존재하지 않습니다.',
            'ocr.goal1': '목표 1: LLM 생성 코퍼스와 브라우저 렌더링을 활용해 한국어·일본어 OCR 합성 파이프라인을 구축합니다.',
            'ocr.goal2': '목표 2: 체크포인트 재개, 모델 config YAML, 구조화된 리포트를 갖춘 재현 가능한 평가 프레임워크를 만듭니다.',
            'ocr.goal3': '목표 3: 오픈 데이터셋을 HuggingFace Hub에 퍼블리시하고 리더보드를 지속적으로 운영합니다.',
            'ocr.feat1': 'LLM 기반 코퍼스 생성: OpenAI API로 현실감 있는 한국어·일본어 텍스트 코퍼스를 생성하고, 생성·퍼블리시 워크플로우 전반에 재사용합니다.',
            'ocr.feat2': 'Headless Playwright 렌더러: Chromium이 마크다운 페이지를 렌더링하며 노이즈·블러·문자 유사도 기반 오타 치환을 설정값으로 조절합니다.',
            'ocr.feat3': '평가 파이프라인: YAML 모델 config, 배치 API, 체크포인트 재개를 지원하며 JSON/Markdown/HTML 리포트와 언어별 리더보드 파일을 출력합니다.',
            'ocr.feat4': 'HuggingFace 퍼블리싱: 샤드 단위 업로드에 샤드별 메타데이터, realism_stats.json, run_manifest.json을 포함해 완전한 재현성을 보장합니다.',
            'ocr.chal1': '수식 렌더링: 마크다운에 LaTeX 수식이 포함되어 XeLaTeX + latex-to-image 통합 및 장시간 실행을 위한 수식 렌더 캐싱이 필요했습니다.',
            'ocr.chal2': '오타 현실감: 문자 유사도 데이터베이스를 구축해 실제 스캔 노이즈에 가까운 오타 치환을 구현했습니다.',
            'ocr.chal3': '대규모 재개 처리: run_manifest.json 기반 샤드 출력으로 중간에 중단된 생성 작업을 중복 없이 이어받을 수 있도록 했습니다.',
            'ocr.chal4': '평가 일관성: 체크포인트 기반 채점으로 중복 집계를 방지하고, 프로토콜 스냅샷으로 데이터셋 버전을 고정해 결과 비교 일관성을 유지했습니다.',
            'ocr.result1': '한국어 리더보드: 1위 LightOnOCR-2-1B가 텍스트·표·수식 통합 avg_markdown_overall_score 0.9737 달성 (100/100 성공률).',
            'ocr.result2': '일본어 리더보드: 1위 모델 0.9777, Nanonets-OCR2-3B 0.9605, DotsOCR 0.9288로 모델 간 성능 차이를 정량 비교했습니다.',
            'ocr.result3': '파이프라인 안정성: 생성·퍼블리시·평가 전 과정이 무중단으로 실행되어 반복적인 벤치마크 업데이트가 가능합니다.',
            'ocr.result4': '배운 점: 합성 데이터 품질, 다국어 OCR 특성, 재현 가능한 ML 벤치마크 설계에 대한 깊은 이해를 쌓았습니다.',

            // Application Projects
            // Pomodoro
            'pomodoro.overview': '포모도로 기법(25분 집중, 5분 휴식)을 바탕으로 만든 시간 관리 서비스입니다. 구조화된 집중·휴식 사이클을 통해 생산성을 꾸준히 유지하도록 돕습니다.',
            'pomodoro.feat1': '포모도로 타이머 - 25분 집중 세션 제공',
            'pomodoro.feat2': '휴식 타이머 - 5분 휴식 시간 관리',
            'pomodoro.feat3': '세션 기록 - 완료한 포모도로 횟수 추적',
            'pomodoro.feat4': '크로스 플랫폼 - 웹과 모바일 모두 지원',

            // Delivery
            'delivery.overview': '배달 기사가 아파트 공동현관 비밀번호를 저장하고 공유할 수 있는 서비스입니다. 출입 정보가 없어 생기는 배송 지연을 줄이는 것이 목표였습니다. 처음에는 Android Native(Java)로 개발했고, 이후 Flutter로 옮겨 웹 데모까지 제공했습니다.',
            'delivery.feat1': '비밀번호 저장 - 아파트 공동현관 비밀번호를 안전하게 저장',
            'delivery.feat2': '커뮤니티 공유 - 다른 기사들과 접근 정보 공유',
            'delivery.feat3': '빠른 검색 - 주소로 빠르게 검색',
            'delivery.feat4': '오프라인 지원 - 인터넷 연결 없이도 작동',

            // StudyWithMe
            'studywithme.overview': '소규모 학원을 위한 관리 애플리케이션입니다. 학생 정보, 출석, 강사 스케줄을 한곳에서 관리할 수 있도록 설계했습니다.',
            'studywithme.feat1': '학생 관리 - 학생 정보와 학습 진도 추적',
            'studywithme.feat2': '출석 관리 - 간편한 체크인/체크아웃 시스템',
            'studywithme.feat3': '강사 스케줄링 - 수업 일정을 체계적으로 관리',
            'studywithme.feat4': 'Firebase 백엔드 - 실시간 데이터 동기화 지원',

            // Intern/Startup Projects
            // CJ AI Center Intern
            'cj.overview': 'CJ ENM AI 센터에서 6개월간 인턴으로 근무하며, 한국 드라마 대본을 분석하는 멀티에이전트 파이프라인 개발을 담당했습니다.',
            'cj.contrib1': 'LangChain 기반 멀티에이전트 드라마 대본 분석 파이프라인 설계 및 구현',
            'cj.contrib2': '대사 추출, 화자 식별, 장면 파싱을 포함한 한국어 NLP 처리 파이프라인 개발',
            'cj.contrib3': '콘텐츠 전략 수립에 활용할 수 있는 구조화된 분석 결과(캐릭터, 플롯, 감정) 생성',
            'cj.contrib4': '배치 처리, 진행 추적, 오류 처리를 포함한 확장 가능한 시스템 구축',

            // Embedded AI Lab Intern
            'embedded.overview': 'UNIST Embedded AI Lab에서 연구 인턴으로 활동하며 DDPM 논문을 리뷰하고, MNIST 기반 토이 확산 모델을 학습하며, 샘플링 최적화 방향을 탐색했습니다.',
            'embedded.contrib1': 'DDPM(Denoising Diffusion Probabilistic Models) 논문을 리뷰하고 핵심 아이디어를 구현 관점에서 정리',
            'embedded.contrib2': 'MNIST 데이터셋으로 확산 모델을 직접 학습하는 토이 프로젝트 수행',
            'embedded.contrib3': 'DDIM 샘플링과 Classifier-Free Guidance(CFG)를 적용해 입력 숫자 조건부 생성으로 프로젝트 확장',
            'embedded.contrib4': '타임스텝 샘플링 최적화 방향도 살펴봤지만 뚜렷한 성능 향상은 없었고, 대신 첫 이미지 생성 모델 프로젝트 경험을 확보',

            // Troja
            'troja.overview': '딥페이크 방어 기술을 개발하는 초기 스타트업 Troja에서 NAVER Cloud Platform 위에 딥페이크 생성 모델과 방어 모델을 함께 서빙하는 백엔드 서버를 구축했습니다. inswapper 기반 생성과 LEAT·DIPA 방어 기법을 하나의 프로덕션 환경에서 테스트할 수 있게 했습니다.',

            // Legacy Projects
            // Diffusion Model (Legacy)
            'difflegacy.overview': 'tiny-DDPM과 tiny-stable-diffusion으로 이어지기 전 단계의 초기 버전입니다. DDPM과 확산 모델을 이해하기 위해 만든 첫 구현이었습니다.',
            'difflegacy.feat1': '기본 DDPM 구현 - 확산 과정을 이해하기 위한 교육용 코드',
            'difflegacy.feat2': '노이즈 스케줄링 - 선형 및 코사인 스케줄 실험',
            'difflegacy.feat3': 'MNIST 생성 - 숫자 이미지 생성 실험',
            'difflegacy.feat4': '학습 파이프라인 - 간단한 학습 및 샘플링 루프',

            // Mini Graph RAG (Legacy)
            'minigraphrag.overview': 'tiny-graph-rag 이전 단계의 프로젝트로, 지식 그래프와 벡터 검색을 결합한 RAG 시스템의 초기 프로토타입입니다.',
            'minigraphrag.feat1': '기본 그래프 구축 - LLM 기반 엔티티 추출',
            'minigraphrag.feat2': '벡터 검색 통합 - 기본적인 하이브리드 검색',
            'minigraphrag.feat3': 'Neo4j 연동 - 그래프 데이터베이스 기본 활용',
            'minigraphrag.feat4': '프로토타입 UI - 간단한 쿼리 인터페이스',

            // Gomoku MCP
            'gomoku.overview': 'Model Context Protocol(MCP)을 통해 LLM이 오목을 둘 수 있는 게임 서버입니다. 위협 분석 엔진과 우선순위 기반 착수 추천을 MCP 툴로 노출해, 어떤 LLM이든 보드를 추론하고 전략적 수를 둘 수 있으며, AI vs AI 모드로 두 모델의 대결을 관전할 수 있습니다.',
            'gomoku.feat1': '위협 분석 엔진 - Open-4, Closed-4, Open-3, 갭 패턴을 감지하고 우선순위(1~10)를 매겨 LLM의 착수 결정을 지원합니다',
            'gomoku.feat2': 'MCP 툴 스위트 - set_stone, analyze_threats, get_suggested_moves 등 게임 전체 제어를 MCP 툴로 제공합니다',
            'gomoku.feat3': 'AI vs AI 모드 - OpenRouter를 통해 Gemini, Grok, Kimi 등 서로 다른 LLM끼리 대결을 관전할 수 있습니다',
            'gomoku.feat4': 'CLI & 웹 GUI - 커맨드라인 인터페이스와 브라우저 기반 GUI를 모두 지원합니다',

            // tiny-agent-harness
            'harness.overview': 'OpenAI Codex CLI와 Anthropic Claude Code에서 보이는 supervisor 중심 멀티에이전트 하니스 구조를 작은 크기로 재구성한 토이 프로젝트입니다. 계획, 실행, 리뷰, 툴 호출, 이벤트 채널을 모두 명시적으로 드러내어 읽고 실험하기 쉬운 형태로 만들었습니다.',
            'harness.problem': '문제: 에이전트형 코딩 도구는 내부 오케스트레이션이 프레임워크 뒤에 숨어 있는 경우가 많아, 실제로 어떤 루프와 경계가 동작하는지 이해하고 수정하기 어렵습니다.',
            'harness.goal1': '목표 1: supervisor가 planner, worker, reviewer를 상황에 따라 반복 호출하는 하니스 구조를 작은 코드베이스로 재현합니다.',
            'harness.goal2': '목표 2: 역할별 출력 스키마, 툴 권한, 이벤트 흐름을 분리해 각 레이어를 눈으로 추적 가능하게 만듭니다.',
            'harness.goal3': '목표 3: CLI 실행과 라이브러리 임베딩 둘 다 가능한 형태로 구성해 실험과 확장을 쉽게 만듭니다.',
            'harness.feat1': 'Supervisor-led 루프: 고정된 planner→worker→reviewer 체인이 아니라, supervisor가 다음 서브에이전트를 동적으로 선택하고 같은 역할을 여러 번 재호출할 수 있습니다.',
            'harness.feat2': '명시적 역할 분리: planner는 읽기 중심 분석, worker는 수정/실행, reviewer는 검증에 집중하도록 입력·출력 스키마와 권한을 분리했습니다.',
            'harness.feat3': 'YAML 기반 설정: provider, 역할별 모델, 툴 목록, retry 제한을 설정 파일로 바꿀 수 있어 구조 실험이 쉽습니다.',
            'harness.feat4': '채널/이벤트 아키텍처: `run_started`, `tool_call_finished`, `run_result` 같은 이벤트를 listener/output 채널로 흘려 CLI 출력과 외부 관찰 로직을 분리했습니다.',
            'harness.feat5': '배포 가능한 패키지: `tiny-agent` CLI 엔트리포인트를 제공하고, GitHub에서 바로 설치해 로컬 워크스페이스 대상 에이전트 실행이 가능합니다.',
            'harness.result1': '성과: 실제 코딩 에이전트 제품군의 핵심 구조를 작은 코드베이스로 축약해, 아키텍처를 읽고 실험하기 좋은 학습용 하니스를 만들었습니다.',
            'harness.result2': '성과: 대화형 CLI와 프로그램적 사용 방식을 모두 지원해 데모와 임베딩 실험을 같은 코드로 처리할 수 있습니다.',
            'harness.result3': '성과: supervisor, planner, worker, reviewer, CLI에 대한 pytest 테스트를 갖춰 핵심 루프의 회귀를 점검할 수 있습니다.',
            'harness.result4': '배운 점: 에이전트 신뢰성은 모델 자체보다도 구조화된 출력, 권한 경계, 이벤트 가시성 같은 오케스트레이션 설계에 크게 좌우된다는 점을 확인했습니다.',

            // LLM Mafia
            'llmmafia.overview': '여러 LLM이 서로 다른 역할을 맡아 마피아 게임을 플레이하는 멀티에이전트 시뮬레이터입니다. SpeechQueue 기반 토론 구조 덕분에 단순 턴제 응답이 아니라 실제 토론처럼 발언 요청과 반응이 오가는 상호작용을 관찰할 수 있습니다.',
            'llmmafia.feat1': '멀티 에이전트 시뮬레이션 - 여러 모델이 시민, 마피아, 경찰, 의사 역할로 상호작용합니다.',
            'llmmafia.feat2': 'SpeechQueue 토론 엔진 - 발언 요청 큐를 통해 더 자연스러운 토론 흐름과 후속 반응을 만듭니다.',
            'llmmafia.feat3': '유연한 설정 - 역할 수, 플레이어 수, 모델 조합, random seed를 조정해 실험을 재현할 수 있습니다.',
            'llmmafia.feat4': '시각화 대시보드 - Streamlit UI에서 게임 진행, 로그, 메트릭을 실시간으로 확인할 수 있습니다.'
        }
    };

    var defaults = {
        'section.education': 'Education',
        'section.research': 'Research Interests',
        'section.publications': 'Publications',
        'section.experiences': 'Experiences',
        'section.projects': 'Projects',
        'section.awards': 'Awards & Others',
        'section.links': 'Links',
        'edu.unist': 'UNIST',
        'edu.unist.major': 'Computer Science and Engineering',
        'edu.military': 'Military Service',
        'edu.military.desc': 'Under Military Service',
        'edu.highschool': 'Daegu il Science High School',
        'edu.highschool.major': 'Physics & Computer Science',
        'tag.synth': 'Synthetic Data Generation',
        'tag.cv': 'Computer Vision',
        'tag.vllm': 'Vision LLM',
        'tag.diffusion': 'Diffusion Models',
        'tag.hci': 'Human-Computer Interaction',
        'pub.kormedmcqa.desc': 'Multi-Choice Question Answering Benchmark for Korean Healthcare Professional Licensing Examinations',
        'exp.group.internships': 'Internships',
        'exp.group.startups': 'Startups',
        'exp.role.cj': 'AI/ML Intern',
        'exp.role.embedded': 'Research Intern',
        'exp.role.troja': 'Full-Stack Developer',
        'exp.cj.desc': 'Developed a Korean Drama script analysis pipeline using a Multi-Agentic pipeline (LangChain).',
        'exp.embedded.desc': 'Conducted research on optimization methods in the inference step of diffusion models.',
        'exp.troja.desc': 'Built a deepfake defense backend and MVP web page at an early-stage startup.',
        'tab.llm': 'LLM Systems',
        'tab.generative': 'Generative AI',
        'tab.vision': 'Vision & Applied ML',
        'tab.applications': 'Applications',
        'card.llmmafia': 'Multi-Agent Social Deduction Simulator',
        'card.harness': 'Codex/Claude-Style Agent Harness',
        'card.chatbot': 'Dual-Stage Finance RAG Agent',
        'card.sd': 'From-Scratch SD3-Style Pipeline',
        'card.ocr': 'Synthetic Benchmark for OCR',
        'card.graphrag': 'Knowledge Graph Retrieval System',
        'card.medimg': 'with MedViT-V2',
        'card.drama': 'with Multi-Agents',
        'card.dfdefense': 'Cloud Serving for Defense Models',
        'card.medllm': 'Specialized LLM for Korean Healthcare',
        'card.gomoku': 'MCP-Based Gomoku Game Server with AI vs AI',
        'card.ddpm': 'DDPM, DDIM, and CFG from Scratch',
        'card.bilingual': 'Jeju Dialect to Standard Korean',
        'card.pomodoro': 'Focus Timer for Web and Mobile',
        'card.delivery': 'Shared Access Tool for Couriers',
        'card.studywithme': 'Student Management for Academies',
        'award.awards': 'Awards',
        'award.awards.desc': 'Entered UNIST as the top student and was selected as a Unistar Scholar.',
        'award.teaching': 'Teaching',
        'award.teaching.desc': 'TA in AI Intro and Programming 1',
        'footer.rights': '\u00a9 2026 Junyeong Song. All rights reserved.',
        'hero.intro': 'Computer Science student bridging AI research and production — one rebuild at a time.',
        'hero.caption': 'UNIST · Computer Science and Engineering',
        'hero.vision': 'Hi, I\'m Junyeong Song.<br><br>I don\'t just use AI tools — I rebuild them. Diffusion models, agent harnesses, RAG pipelines, OCR benchmarks: I build minimal versions from scratch because that\'s the fastest way to know exactly where they break and how to fix them.<br><br>I\'m especially drawn to agentic systems — how LLMs reason, plan, and coordinate — and the gap between what works in a paper and what holds up in practice.<br><br>What drives me is the moment a stripped-down prototype teaches me something a paper didn\'t. Build small, learn fast, then make it real.',
        'nav.back': '\u2190 Back to Portfolio',
        'doc.title': 'Junyeong Song | Portfolio',

        // Common project section headers
        'proj.overview': '📋 Project Overview',
        'proj.problem': '🎯 Problem Definition & Goals',
        'proj.features': '⚙️ Key Features & Contributions',
        'proj.challenges': '🔧 Technical Challenges & Solutions',
        'proj.results': '📈 Results & Learnings',
        'proj.tech': '🛠️ Technologies',
        'proj.links': '🔗 Links',
        'proj.simple.overview': '📋 Overview',
        'proj.simple.features': '⚡ Features',
        'proj.simple.achievements': '⚡ Key Achievements',
        'proj.simple.projects': '🚀 Projects',
        'proj.simple.contributions': '⚡ Key Contributions',
        'proj.professional': '📚 Professional Development',

        // Korean Medical LLM
        'medllm.overview': 'Built a Korean medical specialized LLM by constructing a 449,500-sample domain dataset and applying SFT plus model merge on top of google/gemma2-9b.',
        'medllm.problem': 'Problem: General-purpose LLMs often hallucinate on medical questions and show weak understanding of Korean clinical terminology, which is risky in trust-critical healthcare settings.',
        'medllm.goal1': 'Goal 1: Build a reliable Korean medical dataset from licensing exams, disease dictionaries, and medical law documents.',
        'medllm.goal2': 'Goal 2: Maximize medical expertise while preserving general reasoning ability via SFT and model merge.',
        'medllm.goal3': 'Goal 3: Deliver a practical Korean medical domain LLM pipeline for specialized QA tasks.',
        'medllm.feat1': 'Hybrid Dataset Engineering: Built 449,500 training samples from KorMedMCQA, Asan disease dictionary crawls, translated MedExpQA/UltraMed, and legal synthetic QA generated with Solar API.',
        'medllm.feat2': 'Data Freshness: Added newly labeled 2025 Korean medical licensing exam questions.',
        'medllm.feat3': 'Data-Centric Strategy: Compensated for limited expert annotation by combining trusted institutional sources with high-quality translated medical corpora.',
        'medllm.feat4': 'Instruction Tuning Optimization: Structured data as QA/chat instructions instead of plain text to improve instruction-following quality.',
        'medllm.chal1': 'Catastrophic Forgetting: Heavy medical-only tuning degraded general knowledge performance.',
        'medllm.chal2': 'Mixing Ratio Search: Derived a stable Korean:English ratio of 60:40 through iterative experiments and prior-paper analysis.',
        'medllm.chal3': 'Domain-General Balance: Applied approximately General:Medical = 2.5:1 to maintain usability outside narrow medical prompts.',
        'medllm.chal4': 'Merge Strategy: Merged SFT model with a general base to retain conversational capability while keeping domain gains.',
        'medllm.result1': 'Result: Completed an end-to-end Korean medical LLM training pipeline with KorMedMCQA and custom datasets.',
        'medllm.result2': 'Result: Optimized the trade-off between domain adaptation performance and general capability through data mixing and model merge.',
        'medllm.result3': 'Insight: Performance was more sensitive to balanced data composition than to simply increasing domain data volume.',
        'medllm.result4': 'Insight: High-quality translation and synthetic data are key levers for improving minor-language medical LLMs.',

        // Deepfake Defense
        'dfdefense.overview': 'Built a robust backend server on NAVER CLOUD PLATFORM to serve deepfake creation and defense models. The system enables comprehensive testing of both deepfake generation (using inswapper) and defense mechanisms including LEAT and DIPA.',
        'dfdefense.problem': 'Problem: Deepfake technology poses significant threats to personal privacy and information integrity. Existing defense methods are often tested only in research settings.',
        'dfdefense.goal1': 'Goal 1: Create a production-ready backend that can serve both deepfake generation and defense models for comprehensive security testing.',
        'dfdefense.goal2': 'Goal 2: Implement LEAT and DIPA defense mechanisms to protect images from unauthorized face-swapping attacks.',
        'dfdefense.goal3': 'Goal 3: Deploy on cloud infrastructure to enable scalable, accessible testing of defense strategies.',
        'dfdefense.feat1': 'Deepfake Creation Pipeline: Integrated inswapper model for realistic face-swapping, enabling systematic testing of defense mechanisms.',
        'dfdefense.feat2': 'LEAT Defense Implementation: Deployed adversarial attack defense that adds imperceptible perturbations to protect images from face-swapping.',
        'dfdefense.feat3': 'DIPA Defense Integration: Implemented image perturbation technique that disrupts deepfake generation while maintaining visual quality.',
        'dfdefense.feat4': 'Cloud Architecture: Designed scalable backend using Flask, uWSGI, and Nginx on NAVER Cloud Platform for production deployment.',
        'dfdefense.feat5': 'API Design: Created RESTful endpoints for image upload, processing, and defense application.',
        'dfdefense.chal1': 'GPU Memory Management: Multiple deep learning models required efficient GPU memory allocation. Implemented model loading/unloading strategies and batch processing.',
        'dfdefense.chal2': 'Real-time Processing: Defense mechanisms needed to process images quickly. Used PyTorch optimization techniques and CUDA acceleration.',
        'dfdefense.chal3': 'Model Compatibility: Different defense methods had varying input/output formats. Created unified preprocessing and postprocessing pipelines.',
        'dfdefense.chal4': 'Production Stability: Ensured service reliability through uWSGI worker management, Nginx load balancing, and comprehensive error handling.',
        'dfdefense.result1': 'Successful Deployment: Achieved stable production deployment serving both generation and defense models.',
        'dfdefense.result2': 'Defense Effectiveness: LEAT and DIPA methods successfully disrupted face-swapping attempts while maintaining image quality above 95% SSIM.',
        'dfdefense.result3': 'Key Learning: Gained deep understanding of adversarial ML, perturbation-based defenses, and practical challenges of deploying deep learning models.',
        'dfdefense.result4': 'Infrastructure Skills: Developed expertise in cloud deployment, containerization, and building scalable ML serving infrastructure.',

        // Bilingual Translation LLM
        'bilingual.overview': 'Built an encoder-decoder bilingual translation system for Jeju dialect and standard Korean using KoT5/KoBART with PEFT (LoRA, QLoRA) for low-resource training environments.',
        'bilingual.problem': 'Problem: Translation quality for Jeju dialect is hard to sustain under limited GPU resources while preserving linguistic nuance.',
        'bilingual.goal1': 'Goal 1: Build a single model that supports both dialect-to-standard and standard-to-dialect translation.',
        'bilingual.goal2': 'Goal 2: Compare Full fine-tuning, LoRA, and QLoRA for quality-efficiency trade-offs.',
        'bilingual.goal3': 'Goal 3: Achieve practical quantitative performance under constrained hardware.',
        'bilingual.feat1': 'Dataset Engineering: Constructed 453k parallel pairs from AIHub Jeju dialect data and removed identical pairs to increase linguistic signal density.',
        'bilingual.feat2': 'Tag-based Multi-task Learning: Introduced <dialect_to_standard> and <standard_to_dialect> special tokens for bidirectional translation in one model.',
        'bilingual.feat3': 'Training Pipeline: Ran controlled Full/LoRA/QLoRA experiments with Seq2SeqTrainer.',
        'bilingual.feat4': 'Quantitative Evaluation: Validated quality with BLEU and ROUGE-L metrics.',
        'bilingual.feat5': 'Final Performance: Reached BLEU 0.56 and ROUGE-L 0.60 with stable translation quality.',
        'bilingual.chal1': 'OOM Constraint: Full fine-tuning repeatedly failed on Colab T4 (16GB) due to optimizer-state memory overhead.',
        'bilingual.chal2': 'Memory Optimization: Adopted 4-bit QLoRA to drastically reduce memory usage while preserving quality.',
        'bilingual.chal3': 'Ablation Validation: Compared Full and QLoRA with additional compute to verify quality parity.',
        'bilingual.chal4': 'Outcome: Confirmed QLoRA delivers near-Full performance with much lower memory footprint.',
        'bilingual.result1': 'Result: Successfully deployed a single-model bidirectional translation workflow.',
        'bilingual.result2': 'Result: Demonstrated production-relevant translation quality in low-spec GPU environments.',
        'bilingual.result3': 'Insight: Reconfirmed structural strengths of encoder-decoder models for translation-heavy tasks.',
        'bilingual.result4': 'Next: Plan quantitative comparison against decoder-only models at similar parameter scales.',

        // tiny-DDPM
        'ddpm.overview': 'Implemented DDPM from scratch to validate diffusion fundamentals at code level and optimize MNIST generation quality with quantitative metrics.',
        'ddpm.problem': 'Problem: Understanding diffusion models deeply requires direct implementation of paper equations instead of relying on black-box libraries.',
        'ddpm.goal1': 'Goal 1: Translate Ho et al. (2020) equations into working code with faithful forward/reverse diffusion behavior.',
        'ddpm.goal2': 'Goal 2: Add DDIM and classifier-free guidance to improve both sampling speed and fidelity.',
        'ddpm.goal3': 'Goal 3: Build a reproducible quantitative evaluation loop with FID and IS.',
        'ddpm.feat1': 'Noise Scheduling: Implemented linear/cosine schedulers and full forward-reverse diffusion routines.',
        'ddpm.feat2': 'Custom U-Net: Designed residual down/up blocks with attention-based conditioning for stable training.',
        'ddpm.feat3': 'Advanced Sampling: Added DDIM and CFG for faster and controllable conditional generation.',
        'ddpm.feat4': 'Metric-driven Validation: Evaluated model behavior with FID/IS across guidance scales.',
        'ddpm.feat5': 'Best Score: Achieved FID 0.2514 at CFG scale w=0.1.',
        'ddpm.chal1': 'Signal Interference: Simple addition of time and class embeddings caused mode collapse for some digits.',
        'ddpm.chal2': 'Root Cause: Heterogeneous conditioning signals interfered when injected through the same feature path.',
        'ddpm.chal3': 'Fix: Separated conditioning routes and inserted cross-attention at the U-Net bottleneck.',
        'ddpm.chal4': 'Outcome: Restored stable class-conditional generation for digits 0-9.',
        'ddpm.result1': 'Result: Completed an end-to-end DDPM/DDIM/CFG generation pipeline.',
        'ddpm.result2': 'Result: Verified quality gains with FID 0.2514 and guidance-scale ablations.',
        'ddpm.result3': 'Growth: Improved architecture-engineering skill beyond baseline reimplementation.',
        'ddpm.result4': 'Learning: Established disciplined experiment tracking and configuration management practices.',

        // tiny-stable-diffusion
        'sd.overview': 'Implemented a from-scratch Stable Diffusion 3 style pipeline with transformer-based MMDiT to generate 64x64 text-conditioned images.',
        'sd.problem': 'Problem: Needed to move beyond MNIST-scale diffusion and implement latent diffusion plus text conditioning in a practical training setup.',
        'sd.goal1': 'Goal 1: Recreate SD3 core architecture with MMDiT and VAE components.',
        'sd.goal2': 'Goal 2: Build end-to-end text-to-image training and inference at 64x64 resolution.',
        'sd.goal3': 'Goal 3: Evaluate model quality with objective metrics instead of visual-only inspection.',
        'sd.feat1': 'MMDiT Core: Implemented transformer backbone with joint attention for image-text interaction.',
        'sd.feat2': 'Conditioning Path: Added CLIP-L and adaLN-zero based time/text conditioning.',
        'sd.feat3': 'Rectified Flow + VAE: Integrated rectified flow training and beta-VAE latent compression (VAE MSE 0.0002).',
        'sd.feat4': 'Scalable Training Stack: Used LAION/CC3M strategy, Hugging Face streaming, and W&B + RunPod monitoring.',
        'sd.feat5': 'Evaluation Suite: Added FID, CLIP-FID, IS, CLIPScore, PSNR, and MSE for multidimensional validation.',
        'sd.chal1': 'Prompt Overfitting: Small 30k-scale data caused repetitive pattern generation independent of prompts.',
        'sd.chal2': 'Generalization Fix: Expanded to CC3M-scale data and tuned VAE-to-diffusion data ratio.',
        'sd.chal3': 'Slow Convergence: Diffusion loss decreased slowly and training became unstable in long runs.',
        'sd.chal4': 'Stability Fix: Applied logit-normal sampling, min-SNR weighting, and checkpoint-resume workflow.',
        'sd.result1': 'Result: Delivered a working SD3-style text-conditioned generation model with MMDiT and rectified flow.',
        'sd.result2': 'Result: Established a fully quantitative benchmarking pipeline for generation quality and alignment.',
        'sd.result3': 'Result: Completed an end-to-end 64x64 text-to-image training/inference stack.',
        'sd.result4': 'Learning: Strengthened architecture engineering, data strategy design, and resource-aware training operations.',

        // Drama Analysis Pipeline
        'drama.confidential': '🔒 Internal project — source code and detailed outputs are confidential. Metrics and architecture described here are based on personal notes from the internship period.',
        'drama.overview': 'Built a multi-agent pipeline that quantitatively analyzes drama scripts for storyline quality, character appeal, and commercial potential to support production decisions. 4-person team, deployed for actual script review during the alpha-beta-gamma test period at CJ AI Center.',
        'drama.problem': 'Problem: Manual review of 1–4 episodes per script was expensive and slow, with reviewer bias creating inconsistent evaluations and bottlenecks that risked overlooking valuable scripts.',
        'drama.goal1': 'Goal 1: Automate script analysis with objective metrics through a multi-agent system.',
        'drama.goal2': 'Goal 2: Robustly parse diverse script formats (PDF, HWP, DOCX) with high Korean text accuracy.',
        'drama.goal3': 'Goal 3: Improve OCR quality (WER) and scene-classification quality (F1) to a level viable for real production use.',
        'drama.feat1': 'Multi-Format Document Parser: Preprocessing modules to convert PDF, HWP, DOCX scripts into structured text, with a Korean OCR benchmark dataset for validation.',
        'drama.feat2': 'VLM Integration (Qwen2.5-7B-VL): Replaced traditional OCR with a Vision Language Model to handle complex multi-column layouts and Korean text, eliminating ordering errors.',
        'drama.feat3': 'Scene Analysis Agent: Scene-level strength/weakness classifier with CoT prompting, enabling the LLM to reason about contextual nuance and subtext.',
        'drama.feat4': 'AWS On-Demand GPU Deployment: Designed a boto3-driven on-demand EC2 provisioning flow — pre-initialized EBS volume mounts, AMI-based startup, and region-aware GPU capacity selection — eliminating idle GPU costs for this periodic-use workload.',
        'drama.feat5': 'LangChain Orchestration: Connected Parser, Analyzer, and Evaluator agents via LangChain with state-based workflow and conditional parallel execution.',
        'drama.chal1': 'Korean OCR — WER >20%: Traditional OCR (PaddleOCR) showed high error rates and column-ordering failures on multi-column script layouts.',
        'drama.chal2': 'Solution: Switched to Qwen2.5-7B-VL for document-structure-aware parsing. WER dropped from 20% to 7%.',
        'drama.chal3': 'Scene Classification — F1 0.2: Sparse training data and over-segmented genre-specific prompts caused the model to overfit to surface patterns rather than understand narrative nuance.',
        'drama.chal4': 'Solution: Benchmarked Korean-strength reasoning models (Deepseek-R1, c4ai-command-a) and simplified prompts to let the model reason freely. F1 improved from 0.2 to 0.5.',
        'drama.chal5': 'AWS Cold Start & Cost: Naive S3-download setup caused 20–30 min cold starts. Resolved with pre-initialized EBS volumes, AMI snapshots, and uv-based environment setup, plus capacity-aware region selection for A100 GPU availability.',
        'drama.result1': 'OCR Accuracy: WER reduced from 20% → 7% via VLM-based parsing, securing reliable input data for downstream agents.',
        'drama.result2': 'Classification Quality: Scene-level F1 score improved from 0.2 → 0.5 (2.5×) through model selection and prompt simplification.',
        'drama.result3': 'Production Deployment: Pipeline used in actual script review during the alpha-beta-gamma test period. On-demand GPU structure eliminated idle costs for this periodic workload.',
        'drama.result4': 'Key Learnings: Data quality and simple prompting outperform over-engineered constraints. Infrastructure details (EBS mount stability, AMI readiness, regional GPU capacity) matter as much as model performance for real deployments.',

        // tiny-chatbot-agent
        'chatbot.overview': 'Built a finance-domain RAG agent on top of FAQ and ToS data, using a dual-stage retrieval design to balance response speed and legal-text accuracy.',
        'chatbot.problem': 'Problem: Semantic gaps between user wording and policy terminology, clause ambiguity, and hallucinated answers reduced trust in financial QA bots.',
        'chatbot.goal1': 'Goal 1: Implement a dual-stage flow that searches FAQ first and escalates to full ToS retrieval when needed.',
        'chatbot.goal2': 'Goal 2: Improve clause-level retrieval precision with hybrid search and cross-encoder reranking.',
        'chatbot.goal3': 'Goal 3: Add hallucination verification and automated quality evaluation.',
        'chatbot.feat1': 'Dual-Stage RAG: Stage 1 fast FAQ matching, Stage 2 deep policy retrieval for complex cases.',
        'chatbot.feat2': 'Hybrid Search + Reranking: Weighted dense/sparse/metadata search with cross-encoder re-scoring.',
        'chatbot.feat3': 'Hallucination Verifier: Added self-check logic to ensure generated answers are grounded in retrieved evidence.',
        'chatbot.feat4': 'LLM Judge Pipeline: Automated scoring for accuracy, faithfulness, and completeness, including adversarial test cases.',
        'chatbot.feat5': 'MCP Extensibility: Added Model Context Protocol integration for tool-calling agent workflows.',
        'chatbot.feat6': 'Local Inference Ready: Deployed with vLLM/Ollama for security-friendly operation without external data transfer.',
        'chatbot.chal1': 'Term Mismatch: User terms and legal terms often differed, causing retrieval misses.',
        'chatbot.chal2': 'Context Confusion: Similar clauses such as normal cancellation vs forced cancellation were misranked.',
        'chatbot.chal3': 'Fix: Introduced weighted hybrid retrieval and cross-encoder reranking to improve semantic precision.',
        'chatbot.chal4': 'Outcome: Improved Top-5 recall by about 20% over pure vector search and raised final answer quality.',
        'chatbot.result1': 'Result: Completed a full retrieve-verify-evaluate engineering loop beyond basic retrieve-generate design.',
        'chatbot.result2': 'Result: Achieved around +20% Top-5 recall improvement with stronger response reliability.',
        'chatbot.result3': 'Result: Secured long-term extensibility via MCP-based agent orchestration.',
        'chatbot.result4': 'Learning: Established a data-centric workflow driven by evaluation sets and automated metrics.',

        // tiny-graph-rag
        'graphrag.overview': 'Built a graph-based RAG pipeline that extracts entities and relations from unstructured documents and retrieves context through relationship-aware subgraph search.',
        'graphrag.problem': 'Problem: Pure vector retrieval misses relationship structure between people, events, and concepts, especially for multi-hop reasoning.',
        'graphrag.goal1': 'Goal 1: Implement Graph RAG core logic natively without relying on external graph framework abstractions.',
        'graphrag.goal2': 'Goal 2: Auto-build knowledge graphs and rank query-relevant subgraphs efficiently.',
        'graphrag.goal3': 'Goal 3: Improve contextual retrieval quality for relation-heavy questions.',
        'graphrag.feat1': 'Extraction Engine: Implemented LLM-based node/edge extraction into structured JSON.',
        'graphrag.feat2': 'Custom Graph Model: Designed in-memory graph classes with JSON persistence support.',
        'graphrag.feat3': 'Retrieval & Ranking: Added BFS expansion from seed entities with centrality/relevance scoring.',
        'graphrag.feat4': 'Interactive Visualization: Integrated Streamlit and PyVis dashboards for graph inspection and response tracing.',
        'graphrag.chal1': 'API Bottleneck: Sequential chunk processing scaled poorly on long documents.',
        'graphrag.chal2': 'Throughput Fix: Added asyncio-based asynchronous batching for faster extraction.',
        'graphrag.chal3': 'Entity Duplication: Alias variants generated fragmented nodes and weak graph connectivity.',
        'graphrag.chal4': 'ER Fix: Combined rule-based + semantic merging with threshold and relation-conflict guards, reducing duplicate nodes from 50 to 15.',
        'graphrag.result1': 'Result: Delivered an end-to-end native Graph RAG implementation from preprocessing to generation.',
        'graphrag.result2': 'Result: Improved graph quality and retrieval accuracy by cutting duplicate entities by about 70%.',
        'graphrag.result3': 'Result: Enabled discovery of hidden cross-document relations that simple text retrieval missed.',
        'graphrag.result4': 'Learning: Confirmed preprocessing quality, especially entity resolution, is a primary determinant of Graph RAG performance.',

        // Medical Image Classification
        'medimg.overview': 'Deep learning-based medical image classification project exploring custom CNN architectures and Vision Transformer (ViT).',
        'medimg.problem': 'Problem: Medical image classification faces unique challenges like limited labeled data and class imbalance.',
        'medimg.goal1': 'Goal 1: Compare CNN and ViT architectures for medical image classification.',
        'medimg.goal2': 'Goal 2: Develop effective data augmentation strategies for limited labeled medical data.',
        'medimg.goal3': 'Goal 3: Address class imbalance problems common in medical datasets.',
        'medimg.feat1': 'CNN Architecture: Designed and implemented custom Convolutional Neural Network optimized for medical images.',
        'medimg.feat2': 'ViT Exploration: Applied Vision Transformer architecture and compared performance with CNN.',
        'medimg.feat3': 'Data Augmentation: Implemented augmentation techniques suitable for medical images.',
        'medimg.feat4': 'Imbalance Handling: Applied weighted loss functions and oversampling techniques.',
        'medimg.chal1': 'Data Scarcity: Limited labeled medical images. Supplemented with data augmentation and transfer learning.',
        'medimg.chal2': 'Class Imbalance: Some disease classes were rare. Solved with weighted loss and oversampling techniques.',
        'medimg.chal3': 'Model Interpretability: Medical diagnosis needs explanation. Analyzed attention regions with GradCAM visualization.',
        'medimg.chal4': 'Generalization: Performance drops on different domains. Applied diverse data sources and regularization techniques.',
        'medimg.result1': 'Classification Performance: Both CNN and ViT achieved high accuracy, ViT performing better in some cases.',
        'medimg.result2': 'Data Efficiency: Augmentation techniques significantly improved model performance on limited data.',
        'medimg.result3': 'Interpretable Results: GradCAM visualization confirmed model focuses on correct regions.',
        'medimg.result4': 'Key Learning: Gained expertise in medical image analysis, data imbalance handling, and model interpretability.',

        // Synthetic OCR Image Generator
        'ocr.overview': 'A markdown-first synthetic OCR dataset generator and benchmarking toolkit covering the full pipeline: LLM-backed corpus generation → headless Playwright rendering with realistic noise → HuggingFace publishing → reproducible OCR/VLM model evaluation → ranked leaderboard. Supports Korean and Japanese.',
        'ocr.problem': 'Problem: High-quality labeled OCR data for Korean and Japanese is scarce and expensive to collect, and no reproducible benchmark exists to compare models fairly across text, table, and formula categories.',
        'ocr.goal1': 'Goal 1: Build a realistic synthetic OCR pipeline for Korean and Japanese using LLM-generated corpus and browser-rendered markdown.',
        'ocr.goal2': 'Goal 2: Create a reproducible evaluation framework with checkpoint resume, model config YAMLs, and structured reports.',
        'ocr.goal3': 'Goal 3: Publish open datasets to HuggingFace Hub and maintain a living leaderboard.',
        'ocr.feat1': 'LLM-Backed Corpus Generation: OpenAI API generates realistic Korean/Japanese text corpus, reused across generation and publish workflows.',
        'ocr.feat2': 'Headless Playwright Renderer: Chromium renders markdown pages with configurable noise, blur, and character-similarity-based typo substitutions for realistic documents.',
        'ocr.feat3': 'Evaluation Pipeline: YAML model configs, batch API support, checkpoint-based resume — outputs JSON/Markdown/HTML reports and leaderboard files per language.',
        'ocr.feat4': 'HuggingFace Publishing: Sharded dataset upload with per-shard metadata, realism_stats.json, and run_manifest.json for full reproducibility.',
        'ocr.chal1': 'Formula Rendering: Markdown pages include LaTeX formulas, requiring XeLaTeX + latex-to-image integration and bounded formula-render caching for long runs.',
        'ocr.chal2': 'Typo Realism: Built a character similarity database to generate plausible substitution errors, making synthetic text more representative of real scan noise.',
        'ocr.chal3': 'Scale & Resumability: Sharded output with run_manifest.json allows generation to resume mid-run without duplicating completed shards.',
        'ocr.chal4': 'Evaluation Consistency: Checkpoint-based scoring prevents double-counting; protocol snapshots pin dataset versions so results remain comparable across runs.',
        'ocr.result1': 'Korean OCR Leaderboard: Top model (LightOnOCR-2-1B) achieved 0.9737 avg_markdown_overall_score across text, table, and formula categories (100/100 success rate).',
        'ocr.result2': 'Japanese OCR Leaderboard: Top model achieved 0.9777, with Nanonets-OCR2-3B scoring 0.9605 and DotsOCR 0.9288.',
        'ocr.result3': 'Pipeline Reliability: End-to-end generation, publish, and evaluation flow runs without manual intervention, enabling repeatable benchmark updates.',
        'ocr.result4': 'Key Learning: Gained deep expertise in synthetic data quality, multi-language OCR challenges, and building reproducible ML benchmarks.',

        // Application Projects
        // Pomodoro
        'pomodoro.overview': 'A time management service based on the Pomodoro technique (25 minutes focus, 5 minutes rest). Helps users maintain productivity through structured work and break cycles.',
        'pomodoro.feat1': 'Pomodoro Timer - 25 minutes focus sessions',
        'pomodoro.feat2': 'Break Timer - 5 minutes rest periods',
        'pomodoro.feat3': 'Session Tracking - Track completed pomodoros',
        'pomodoro.feat4': 'Cross-platform - Works on web and mobile',

        // Delivery
        'delivery.overview': 'A service for delivery drivers to store and share apartment entrance passwords, aiming to reduce delays caused by missing access information. Originally built as Android Native (Java), now migrated to Flutter for web demo.',
        'delivery.feat1': 'Password Storage - Securely store apartment entrance codes',
        'delivery.feat2': 'Community Sharing - Share access information with other drivers',
        'delivery.feat3': 'Quick Lookup - Fast search by address',
        'delivery.feat4': 'Offline Support - Works without internet connection',

        // StudyWithMe
        'studywithme.overview': 'A management application designed for small-scale educational academies. It facilitates the management of student data, attendance, and teacher scheduling.',
        'studywithme.feat1': 'Student Management - Track student information and progress',
        'studywithme.feat2': 'Attendance Tracking - Easy check-in/check-out system',
        'studywithme.feat3': 'Teacher Scheduling - Manage class schedules',
        'studywithme.feat4': 'Firebase Backend - Real-time data synchronization',

        // Intern/Startup Projects
        // CJ AI Center Intern
        'cj.overview': 'Worked as an intern at CJ ENM AI Center for 6 months. Developed Multi-Agentic pipeline for Korean drama script analysis.',
        'cj.contrib1': 'Designed and implemented multi-agent drama script analysis pipeline using LangChain',
        'cj.contrib2': 'Developed Korean NLP processing pipeline including dialogue extraction, speaker identification, and scene parsing',
        'cj.contrib3': 'Generated structured analysis results (characters, plot, emotions) for content strategy decisions',
        'cj.contrib4': 'Built scalable system with batch processing, progress tracking, and error handling',

        // Embedded AI Lab Intern
        'embedded.overview': 'Worked as a research intern at UNIST Embedded AI Lab, reviewing DDPM papers, training a toy diffusion model on MNIST, and exploring sampling optimization directions.',
        'embedded.contrib1': 'Reviewed the DDPM (Denoising Diffusion Probabilistic Models) paper and organized key ideas from an implementation perspective',
        'embedded.contrib2': 'Ran a hands-on toy project training a diffusion model on the MNIST dataset',
        'embedded.contrib3': 'Extended the project with DDIM sampling and classifier-free guidance (CFG) to generate digit images conditioned on input numbers',
        'embedded.contrib4': 'Investigated timestep sampling optimization studies; no significant gains were observed, but it became a valuable first image-generation model project experience',

        // Troja
        'troja.overview': 'At Troja, an early-stage deepfake prevention startup, built a backend server on NAVER Cloud Platform to serve deepfake generation and defense models. Enabled in-house testing of both face-swapping (inswapper) and adversarial defenses (LEAT, DIPA) in a single production environment.',

        // Legacy Projects
        // Diffusion Model (Legacy)
        'difflegacy.overview': 'Previous version of tiny-DDPM and tiny-stable-diffusion. Initial implementation for learning DDPM and diffusion models.',
        'difflegacy.feat1': 'Basic DDPM Implementation - Educational code for understanding diffusion process',
        'difflegacy.feat2': 'Noise Scheduling - Linear and cosine schedule experiments',
        'difflegacy.feat3': 'MNIST Generation - Digit image generation experiments',
        'difflegacy.feat4': 'Training Pipeline - Simple training and sampling loop',

        // Mini Graph RAG (Legacy)
        'minigraphrag.overview': 'Previous version of tiny-graph-rag. Initial prototype of RAG system combining knowledge graphs with vector search.',
        'minigraphrag.feat1': 'Basic Graph Construction - LLM-based entity extraction',
        'minigraphrag.feat2': 'Vector Search Integration - Basic hybrid search',
        'minigraphrag.feat3': 'Neo4j Integration - Basic graph database utilization',
        'minigraphrag.feat4': 'Prototype UI - Simple query interface',

        // Gomoku MCP
        'gomoku.overview': 'A Gomoku (Five-in-a-Row) game server that lets LLMs play via the Model Context Protocol. Exposes a tactical threat analysis engine and priority-ranked move suggestions as MCP tools, so any LLM can reason about the board and make strategic moves — including an AI vs AI mode to watch two models compete head-to-head.',
        'gomoku.feat1': 'Threat Analysis Engine - Pattern detector that scores Open-4, Closed-4, Open-3, and gap patterns with priority levels 1–10, guiding the LLM\'s move decisions',
        'gomoku.feat2': 'MCP Tool Suite - set_stone, analyze_threats, get_suggested_moves and more — full game control exposed as MCP tools',
        'gomoku.feat3': 'AI vs AI Mode - Watch two different LLMs (Gemini, Grok, Kimi, etc.) compete against each other via OpenRouter',
        'gomoku.feat4': 'CLI & Web GUI - Both a command-line interface and a browser-based GUI for observing games in real time',

        // tiny-agent-harness
        'harness.overview': 'A toy project that reconstructs the supervisor-led multi-agent harness pattern seen in tools like OpenAI Codex CLI and Anthropic Claude Code. It keeps planning, execution, review, tool calls, and event channels explicit so the whole architecture stays readable and easy to experiment with.',
        'harness.problem': 'Problem: Many agentic coding tools hide orchestration details behind frameworks, which makes it hard to inspect or modify the actual control loop and tool boundaries.',
        'harness.goal1': 'Goal 1: Recreate a supervisor that can repeatedly delegate to planner, worker, and reviewer agents in a compact codebase.',
        'harness.goal2': 'Goal 2: Keep role-specific schemas, tool permissions, and event flow explicit so each layer is easy to trace.',
        'harness.goal3': 'Goal 3: Support both interactive CLI usage and programmatic embedding for fast experiments and extensions.',
        'harness.feat1': 'Supervisor-Led Loop: Instead of a fixed planner-to-worker-to-reviewer chain, the supervisor dynamically chooses the next subagent and can revisit the same role multiple times.',
        'harness.feat2': 'Explicit Role Boundaries: Planner focuses on read-only analysis, worker handles edits and commands, and reviewer validates outputs with separate schemas and tool scopes.',
        'harness.feat3': 'YAML Configuration: Provider, per-role models, allowed tools, and retry limits are configurable without touching the code.',
        'harness.feat4': 'Channel/Event Architecture: Events such as `run_started`, `tool_call_finished`, and `run_result` flow through listener and output channels, separating execution from presentation.',
        'harness.feat5': 'Installable Package: Ships a `tiny-agent` CLI entrypoint and can be installed directly from GitHub for immediate local-workspace experiments.',
        'harness.result1': 'Result: Condensed the core architecture of modern coding-agent products into a small, inspectable harness suited for learning and experimentation.',
        'harness.result2': 'Result: The same codebase supports both interactive terminal runs and embedded library-style usage.',
        'harness.result3': 'Result: Pytest coverage spans supervisor, planner, worker, reviewer, and CLI behavior to catch regressions in the core loop.',
        'harness.result4': 'Learning: Agent reliability depends heavily on orchestration design choices like structured outputs, permission boundaries, and event visibility, not just on model quality.',

        // LLM Mafia
        'llmmafia.overview': 'A multi-agent social deduction simulator where different LLMs play Mafia under distinct roles. The SpeechQueue-based debate flow lets agents request turns, interrupt, and react more like a real discussion than a simple turn-based loop.',
        'llmmafia.feat1': 'Multi-Agent Simulation - Multiple models interact as mafia, police, doctor, and citizens.',
        'llmmafia.feat2': 'SpeechQueue Debate Engine - A queued speaking system creates more realistic debates and follow-up reactions.',
        'llmmafia.feat3': 'Flexible Configuration - Tune role counts, player counts, model assignments, and random seeds for reproducible experiments.',
        'llmmafia.feat4': 'Interactive Dashboard - Streamlit UI for observing game progress, logs, and metrics in real time.'
    };

    function getLang() {
        var saved = localStorage.getItem('lang');
        if (saved) return saved;
        var browserLang = (navigator.language || '').toLowerCase();
        return browserLang.startsWith('ko') ? 'ko' : 'en';
    }

    function setLang(lang) {
        localStorage.setItem('lang', lang);
        applyTranslations(lang);
    }

    function applyTranslations(lang) {
        var dict = lang === 'ko' ? translations.ko : defaults;

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.textContent = dict[key];
            }
        });

        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-html');
            if (dict[key] !== undefined) {
                el.innerHTML = dict[key];
            }
        });

        document.documentElement.lang = lang === 'ko' ? 'ko' : 'en';

        if (defaults['doc.title'] && dict['doc.title']) {
            document.title = dict['doc.title'];
        }

        var btn = document.getElementById('langToggle');
        if (btn) {
            btn.textContent = lang === 'ko' ? 'EN' : '한';
        }
    }

    var currentLang = getLang();
    applyTranslations(currentLang);

    var langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', function () {
            var next = getLang() === 'ko' ? 'en' : 'ko';
            setLang(next);
        });
    }
})();
