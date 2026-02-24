// Language Toggle Script (Shared)
(function () {
    var translations = {
        ko: {
            // Section titles (main page)
            'section.education': '학력',
            'section.research': '연구 관심 분야',
            'section.publications': '논문',
            'section.experiences': '경력',
            'section.projects': '프로젝트',
            'section.awards': '수상 & 기타',
            'section.links': '링크',

            // Education
            'edu.unist': 'UNIST (울산과학기술원)',
            'edu.unist.major': '컴퓨터공학과',
            'edu.military': '군 복무',
            'edu.military.desc': '현역 복무',
            'edu.highschool': '대구일과학고등학교',
            'edu.highschool.major': '물리 & 컴퓨터 과학',

            // Research tags
            'tag.synth': '합성 데이터 생성',
            'tag.cv': '컴퓨터 비전',
            'tag.vllm': '비전 LLM',
            'tag.diffusion': '확산 모델',

            // Publications
            'pub.kormedmcqa.desc': '한국 의료 전문 자격시험을 위한 다지선다형 질의응답 벤치마크',

            // Experiences
            'exp.cj.desc': 'Multi-Agentic 파이프라인(LangChain)을 활용한 한국 드라마 대본 분석 파이프라인을 개발했습니다.',
            'exp.embedded.desc': '확산 모델의 추론 단계 최적화 방법에 대한 연구를 수행했습니다.',

            // Tab buttons
            'tab.aiml': 'AI/ML',
            'tab.applications': '애플리케이션',
            'tab.startup': '스타트업 & 인턴',

            // Awards
            'award.awards': '수상',
            'award.awards.desc': '수석 졸업 후 Unistar 장학금으로 UNIST 입학',
            'award.teaching': '교육',
            'award.teaching.desc': 'AI 개론 및 프로그래밍 1 조교',

            // Footer & Navigation
            'footer.rights': '© 2026 송준영. All rights reserved.',
            'hero.vision': '안녕하세요, 송준영이에요.<br><br>저는 AI/ML 분야에 깊은 관심이 있어요. 특히 OCR, Synthetic Dataset 구축, Agentic Pipeline 설계, 그리고 Image Generation 모델에 큰 흥미를 느끼고 있어요.<br><br>기술을 단순히 구현하는 데에서 그치기보다는, 그 기술이 실제로 어떤 가치를 만들어낼 수 있는지 고민하는 과정을 중요하게 생각해요. 하나를 배우면 자연스럽게 "이 다음에는 무엇이 있을까?", "이걸 어떻게 현실적인 문제 해결로 연결할 수 있을까?"라는 질문을 하게 되고, 그런 궁금증이 저를 계속 탐구하게 만드는 원동력이 돼요.<br><br>저를 가장 크게 동기부여하는 요소는 재미와 호기심이에요. 배우는 과정 자체에서 즐거움을 느끼고, 그 즐거움이 더 깊이 탐구하고 확장하게 만드는 힘이라고 생각해요.',
            'nav.back': '← 포트폴리오로 돌아가기',
            'doc.title': '송준영 | 포트폴리오',

            // Common project section headers
            'proj.overview': '📋 프로젝트 개요',
            'proj.problem': '🎯 문제 정의 및 목표',
            'proj.features': '⚙️ 주요 기능 및 기여',
            'proj.challenges': '🔧 기술적 도전 및 해결',
            'proj.results': '📈 결과 및 배운 점',
            'proj.tech': '🛠️ 기술 스택',
            'proj.links': '🔗 링크',
            'proj.simple.overview': '📋 개요',
            'proj.simple.features': '⚡ 주요 기능',
            'proj.simple.achievements': '⚡ 주요 성과',
            'proj.simple.projects': '🚀 프로젝트',
            'proj.simple.contributions': '⚡ 주요 기여',
            'proj.professional': '📚 전문성 개발',

            // Korean Medical LLM
            'medllm.overview': '한국어 의료 데이터 부족 문제를 해결하기 위해 약 44만 9,500건 규모의 특화 데이터셋을 구축하고, google/gemma2-9b 기반 SFT와 Model Merge를 적용해 한국어 의료 도메인 특화 LLM을 개발했습니다.',
            'medllm.problem': '문제: 범용 LLM은 의료 질의에서 환각 응답을 보이거나 한국어 의학 용어 이해도가 낮아, 신뢰성이 중요한 의료 도메인에 바로 적용하기 어렵습니다.',
            'medllm.goal1': '목표 1: 국가고시, 질병사전, 의료 법률 등 신뢰 가능한 소스를 기반으로 고품질 한국어 의료 데이터셋을 구축합니다.',
            'medllm.goal2': '목표 2: SFT와 Model Merge를 통해 의료 전문성을 높이면서 일반 상식 능력을 유지하는 균형점을 찾습니다.',
            'medllm.goal3': '목표 3: 한국어 의료 질의응답에서 실무적으로 활용 가능한 Specialized LLM 파이프라인을 완성합니다.',
            'medllm.feat1': '하이브리드 데이터셋 구축: KorMedMCQA, 아산병원 질병사전, MedExpQA/UltraMed 번역 데이터, 의료 법률 기반 Synthetic QA를 포함한 449,500건 데이터셋을 구성했습니다.',
            'medllm.feat2': '최신성 반영: 2025년도 의사국가고시 기출문제를 신규 라벨링해 데이터 최신성을 강화했습니다.',
            'medllm.feat3': 'Data-Centric 전략: 의료 전문가 부재 상황에서 공신력 있는 기관 데이터 가공과 고품질 번역 데이터를 결합해 도메인 지식을 보강했습니다.',
            'medllm.feat4': 'Instruction Tuning 최적화: 단순 텍스트가 아닌 QA/Chat 포맷 중심으로 데이터 구조를 설계해 지시 이행 능력을 높였습니다.',
            'medllm.chal1': 'Catastrophic Forgetting: 의료 데이터 비중을 과도하게 높이면 일반 상식 능력이 저하되는 문제가 발생했습니다.',
            'medllm.chal2': '혼합 비율 탐색: 선행연구 분석과 반복 실험으로 한국어:영어 = 60:40 비율을 도출했습니다.',
            'medllm.chal3': '도메인-범용 균형: General:Medical 약 2.5:1 비율을 적용해 범용성과 전문성의 균형을 맞췄습니다.',
            'medllm.chal4': '모델 병합 전략: SFT 모델과 범용 모델을 Merge하여 의료 성능을 유지하면서 일반 대화 품질 저하를 완화했습니다.',
            'medllm.result1': '성과: KorMedMCQA 및 자체 데이터 기반의 한국어 의료 LLM 학습 파이프라인을 완성했습니다.',
            'medllm.result2': '성과: 데이터 배합과 Model Merge를 통해 도메인 적응 성능과 범용성 간 트레이드오프를 최적화했습니다.',
            'medllm.result3': '인사이트: 도메인 특화 모델은 데이터 양보다 데이터 혼합 비율의 균형이 성능에 더 큰 영향을 준다는 점을 확인했습니다.',
            'medllm.result4': '인사이트: 저자원 언어 의료 LLM 성능 향상에는 고품질 번역 데이터와 합성 데이터 활용 전략이 핵심임을 확인했습니다.',

            // Deepfake Defense
            'dfdefense.overview': '딥페이크 생성 및 방어 모델을 서빙하기 위해 네이버 클라우드 플랫폼에 강건한 백엔드 서버를 구축했습니다. 이 시스템은 딥페이크 생성(inswapper 사용)과 LEAT, DIPA 등 최신 방어 메커니즘의 종합적인 테스트를 가능하게 합니다.',
            'dfdefense.problem': '문제: 딥페이크 기술은 개인 프라이버시와 정보 무결성에 심각한 위협을 가합니다. 기존 방어 방법은 연구 환경에서만 테스트되어 실제 배포 검증이 부족합니다.',
            'dfdefense.goal1': '목표 1: 포괄적인 보안 테스트를 위해 딥페이크 생성 및 방어 모델을 모두 서빙할 수 있는 프로덕션 레디 백엔드를 구축합니다.',
            'dfdefense.goal2': '목표 2: 무단 얼굴 스왑 공격으로부터 이미지를 보호하기 위해 LEAT 및 DIPA 방어 메커니즘을 구현합니다.',
            'dfdefense.goal3': '목표 3: 확장 가능하고 접근 가능한 방어 전략 테스트를 위해 클라우드 인프라에 배포합니다.',
            'dfdefense.feat1': '딥페이크 생성 파이프라인: 방어 메커니즘의 체계적인 테스트를 위해 inswapper 모델을 통합했습니다.',
            'dfdefense.feat2': 'LEAT 방어 구현: 얼굴 스왑으로부터 이미지를 보호하기 위해 감지할 수 없는 섭동을 추가하는 적대적 공격 방어를 배포했습니다.',
            'dfdefense.feat3': 'DIPA 방어 통합: 시각적 품질을 유지하면서 딥페이크 생성을 방해하는 이미지 섭동 기술을 구현했습니다.',
            'dfdefense.feat4': '클라우드 아키텍처: 프로덕션 배포를 위해 네이버 클라우드 플랫폼에서 Flask, uWSGI, Nginx를 사용한 확장 가능한 백엔드를 설계했습니다.',
            'dfdefense.feat5': 'API 설계: 이미지 업로드, 처리, 방어 적용을 위한 RESTful 엔드포인트를 구축했습니다.',
            'dfdefense.chal1': 'GPU 메모리 관리: 여러 딥러닝 모델에 효율적인 GPU 메모리 할당이 필요했습니다. 리소스 사용을 최적화하기 위해 모델 로딩/언로딩 전략과 배치 처리를 구현했습니다.',
            'dfdefense.chal2': '실시간 처리: 방어 메커니즘이 빠른 이미지 처리를 필요로 했습니다. PyTorch 최적화 기술과 CUDA 가속을 사용하여 허용 가능한 지연 시간을 달성했습니다.',
            'dfdefense.chal3': '모델 호환성: 다양한 방어 방법의 입출력 형식이 달랐습니다. 원활한 통합을 위해 통합된 전처리 및 후처리 파이프라인을 구축했습니다.',
            'dfdefense.chal4': '프로덕션 안정성: uWSGI 워커 관리, Nginx 로드 밸런싱, 종합적인 오류 처리를 통해 서비스 안정성을 보장했습니다.',
            'dfdefense.result1': '성공적인 배포: 생성 및 방어 모델을 모두 서빙하는 안정적인 프로덕션 배포를 달성했습니다.',
            'dfdefense.result2': '방어 효과: LEAT 및 DIPA 방법이 95% 이상의 SSIM 이미지 품질을 유지하면서 얼굴 스왑 시도를 성공적으로 방해했습니다.',
            'dfdefense.result3': '주요 학습: 적대적 ML, 섭동 기반 방어, 프로덕션에서 딥러닝 모델 배포의 실제 과제에 대한 깊은 이해를 얻었습니다.',
            'dfdefense.result4': '인프라 역량: 클라우드 배포, 컨테이너화, 확장 가능한 ML 서빙 인프라 구축 전문성을 개발했습니다.',

            // Bilingual Translation LLM
            'bilingual.overview': '제주 방언과 표준 한국어 간 양방향 번역을 위해 KoT5/KoBART 기반 Encoder-Decoder 모델을 구축하고, PEFT(LoRA, QLoRA)를 적용해 저자원 환경에서도 성능을 확보한 프로젝트입니다.',
            'bilingual.problem': '문제: 번역 태스크에서는 Encoder-Decoder가 여전히 강점이 있지만, 제한된 GPU 환경에서 고품질 방언 번역 모델을 학습하기 어렵고 문맥적 뉘앙스 보존도 까다롭습니다.',
            'bilingual.goal1': '목표 1: 단일 모델로 제주 방언↔표준어 양방향 번역이 가능한 통합 파이프라인을 구축합니다.',
            'bilingual.goal2': '목표 2: Full Fine-tuning, LoRA, QLoRA를 비교해 성능과 자원 효율의 균형점을 찾습니다.',
            'bilingual.goal3': '목표 3: 제한된 리소스에서도 실무 적용 가능한 정량 성능을 확보합니다.',
            'bilingual.feat1': '데이터셋 엔지니어링: AIHub 제주 방언 데이터를 정제해 453k 병렬 Pair를 구축하고, 표준어와 방언이 100% 동일한 샘플을 제거해 학습 밀도를 높였습니다.',
            'bilingual.feat2': '멀티태스크 학습: <dialect_to_standard>, <standard_to_dialect> 스페셜 토큰을 도입해 단일 모델 양방향 번역을 구현했습니다.',
            'bilingual.feat3': '학습 파이프라인: Seq2SeqTrainer 기반으로 Full/LoRA/QLoRA 실험을 체계적으로 수행했습니다.',
            'bilingual.feat4': '정량 평가: BLEU와 ROUGE-L을 기준으로 모델 품질을 비교 검증했습니다.',
            'bilingual.feat5': '최종 성능: BLEU 0.56, ROUGE-L 0.60을 달성해 안정적인 번역 품질을 확인했습니다.',
            'bilingual.chal1': 'OOM 이슈: Colab T4(16GB) 환경에서 Full Fine-tuning 중 Optimizer 상태 메모리로 OOM이 반복 발생했습니다.',
            'bilingual.chal2': '메모리 최적화: QLoRA 4-bit 양자화를 적용해 메모리 사용량을 크게 줄이면서 성능 저하를 최소화했습니다.',
            'bilingual.chal3': '성능 검증: 추가 리소스 환경에서 Full 모델과 QLoRA 모델을 비교해 성능-효율 트레이드오프를 분석했습니다.',
            'bilingual.chal4': '검증 결과: QLoRA가 낮은 메모리 점유율에서도 Full Fine-tuning에 준하는 성능을 유지함을 확인했습니다.',
            'bilingual.result1': '성과: 태그 기반 프롬프팅으로 단일 모델 양방향 번역 시스템을 안정적으로 구현했습니다.',
            'bilingual.result2': '성과: 저사양 GPU 환경에서도 QLoRA 기반으로 상용 수준에 가까운 번역 모델 개발 역량을 확보했습니다.',
            'bilingual.result3': '회고: 번역 특화 태스크에서 Encoder-Decoder 아키텍처의 구조적 강점을 재확인했습니다.',
            'bilingual.result4': '향후 계획: 동일 파라미터 규모의 Decoder-only 모델과 정량 비교해 아키텍처 효율을 추가 분석할 예정입니다.',

            // tiny-DDPM
            'ddpm.overview': 'DDPM의 핵심 메커니즘을 From Scratch로 구현해 생성 모델의 작동 원리를 코드 레벨에서 검증하고, MNIST 생성 성능을 정량 지표로 최적화한 프로젝트입니다.',
            'ddpm.problem': '문제: 최신 Diffusion 모델의 수식과 아키텍처를 라이브러리 추상화 없이 직접 구현하며 체득할 필요가 있었습니다.',
            'ddpm.goal1': '목표 1: Ho et al. (2020) 논문 수식을 코드로 정확히 옮기는 Paper Implementation 역량을 확보합니다.',
            'ddpm.goal2': '목표 2: DDIM, CFG를 추가 구현해 생성 속도와 품질을 동시에 개선합니다.',
            'ddpm.goal3': '목표 3: FID/IS 기반 정량 평가 체계를 구축해 하이퍼파라미터 영향을 검증합니다.',
            'ddpm.feat1': 'Noise Scheduling 구현: Linear/Cosine Scheduler와 Forward/Reverse Diffusion 로직을 직접 설계했습니다.',
            'ddpm.feat2': 'Custom U-Net 설계: ResNet 기반 Down/Upsampling과 Residual Connection, Conditioning 강화를 위한 Attention 구조를 적용했습니다.',
            'ddpm.feat3': '고급 샘플링: Non-Markovian DDIM과 Classifier-Free Guidance를 구현해 추론 효율을 높였습니다.',
            'ddpm.feat4': '정량 평가: FID와 IS로 생성 품질을 수치화하고 Guidance Scale별 성능을 비교했습니다.',
            'ddpm.feat5': '최적 지점 확인: CFG Scale w=0.1에서 FID 0.2514를 기록해 최고 성능을 확인했습니다.',
            'ddpm.chal1': '조건 신호 간섭: Time Embedding과 Class Embedding을 단순 합산했을 때 특정 숫자가 생성되지 않는 Mode Collapse가 발생했습니다.',
            'ddpm.chal2': '원인 분석: 시간 정보와 클래스 정보가 동일 채널로 주입되어 정보 간섭이 발생했습니다.',
            'ddpm.chal3': '해결: Time/Class 경로를 분리하고 U-Net Bottleneck에 Cross-Attention 레이어를 도입해 조건 정보를 명확히 반영했습니다.',
            'ddpm.chal4': '결과: 조건 정보 간섭이 해소되어 0~9 조건부 숫자를 안정적으로 생성하는 모델 학습에 성공했습니다.',
            'ddpm.result1': '성과: DDPM, DDIM, CFG를 포함한 End-to-End 생성 파이프라인을 자체 구현했습니다.',
            'ddpm.result2': '성과: FID 0.2514를 포함한 정량 지표로 성능을 검증하고 Guidance Scale 영향력을 실험적으로 확인했습니다.',
            'ddpm.result3': '성장: 구현을 넘어 Attention 추가 등 구조 개량을 수행하며 아키텍처 엔지니어링 역량을 강화했습니다.',
            'ddpm.result4': '학습: 실험 설정과 결과 기록의 중요성을 체감하며 체계적 실험 관리 프로세스를 정립했습니다.',

            // tiny-stable-diffusion
            'sd.overview': 'Stable Diffusion 3(SD3) 아키텍처를 From Scratch로 구현해 64x64 텍스트-이미지 생성 모델을 구축한 프로젝트입니다. U-Net이 아닌 Transformer 기반 MMDiT 구조를 직접 설계했습니다.',
            'sd.problem': '문제: MNIST 기반 Diffusion 프로젝트의 한계를 넘어 Latent Diffusion과 Text Conditioning을 실제 코드로 구현하고 검증할 필요가 있었습니다.',
            'sd.goal1': '목표 1: SD3 핵심 구조인 MMDiT + VAE 아키텍처를 자체 구현합니다.',
            'sd.goal2': '목표 2: 텍스트 프롬프트 입력부터 64x64 RGB 이미지 생성까지 End-to-End 학습/평가 파이프라인을 구축합니다.',
            'sd.goal3': '목표 3: FID, CLIPScore 등 정량 지표 기반으로 모델 품질을 객관적으로 검증합니다.',
            'sd.feat1': 'MMDiT 구현: Transformer Backbone과 Joint Attention으로 이미지-텍스트 모달 상호작용을 학습했습니다.',
            'sd.feat2': 'Conditioning 설계: CLIP-L 텍스트 인코더와 adaLN-zero를 적용해 Time/Text 임베딩 주입 구조를 안정화했습니다.',
            'sd.feat3': 'Rectified Flow + VAE: Rectified Flow 로직과 beta-VAE를 적용해 Latent Space 학습 효율을 높이고 VAE MSE 0.0002를 달성했습니다.',
            'sd.feat4': '대규모 학습 인프라: LAION/CC3M 데이터 전략, Hugging Face Streaming, W&B + RunPod(A4500) 모니터링 체계를 구축했습니다.',
            'sd.feat5': '정량 평가 체계: FID, CLIP-FID, IS, CLIPScore, PSNR, MSE를 포함한 다각도 평가 파이프라인을 구현했습니다.',
            'sd.chal1': 'Prompt Overfitting: 소규모 데이터셋(30k)에서는 프롬프트와 무관한 패턴 반복 생성이 발생했습니다.',
            'sd.chal2': '일반화 개선: 학습 데이터를 CC3M(3M)으로 확장하고 VAE:Diffusion 데이터 비율을 조정해 과적합을 완화했습니다.',
            'sd.chal3': '수렴 지연: Diffusion 학습이 느리고 불안정해 장기 학습에서 손실 감소가 더뎠습니다.',
            'sd.chal4': '학습 안정화: Logit-normal sampling, Min-SNR weighting, Checkpoint/Resume를 도입해 학습 안정성과 지속 가능성을 높였습니다.',
            'sd.result1': '성과: SD3의 핵심 요소(MMDiT, Rectified Flow)를 자체 구현한 동작 가능한 텍스트 조건부 생성 모델을 확보했습니다.',
            'sd.result2': '성과: 눈대중 평가가 아닌 정량 지표 기반 모델 검증 체계를 완성했습니다.',
            'sd.result3': '성과: 64x64 해상도 텍스트-이미지 생성 파이프라인을 End-to-End로 구축했습니다.',
            'sd.result4': '학습: 최신 논문 아키텍처 구현, 데이터 전략 설계, 제한 자원 환경에서의 학습 운영 역량을 강화했습니다.',

            // Drama Analysis Pipeline
            'drama.overview': '드라마 대본의 줄거리, 캐릭터 매력도, 흥행 요소를 정량 분석해 제작 의사결정을 지원하는 Multi-Agent 기반 파이프라인을 구축한 프로젝트입니다.',
            'drama.problem': '문제: 1~4화 분량 대본을 사람이 직접 검토하는 기존 프로세스는 시간·비용이 크고, 검토자 편향으로 인해 평가 일관성이 낮았습니다.',
            'drama.goal1': '목표 1: Multi-Agent 시스템으로 대본 분석을 자동화하고 객관적 평가 지표를 제공합니다.',
            'drama.goal2': '목표 2: 대본 포맷 다양성(PDF/HWP/DOCX)을 안정적으로 처리하는 전처리 파이프라인을 구축합니다.',
            'drama.goal3': '목표 3: 분석 품질(F1)과 OCR 품질(WER)을 정량 개선해 실무 의사결정 속도를 높입니다.',
            'drama.feat1': 'Multi-Format Parser: PDF, HWP, DOCX를 정형 텍스트로 변환하는 전처리 모듈을 개발했습니다.',
            'drama.feat2': 'VLM 도입: Qwen2.5-7B-VL을 적용해 기존 OCR의 한국어 인식 한계와 복잡한 레이아웃 문제를 개선했습니다.',
            'drama.feat3': 'Scene Analysis Agent: 씬 단위 강점/약점 분류 에이전트와 CoT 프롬프팅을 결합해 문맥 추론 품질을 높였습니다.',
            'drama.feat4': 'LangChain Orchestration: Parser, Analyzer, Evaluator 에이전트를 유기적으로 연결한 워크플로우를 설계했습니다.',
            'drama.feat5': '평가 체계: 한국어 OCR 벤치마크와 분류 지표를 함께 관리해 데이터 신뢰도와 모델 성능을 동시에 검증했습니다.',
            'drama.chal1': 'OCR 한계: 기존 OCR은 한국어 WER 20% 이상, 다단 레이아웃 정렬 오류가 빈번했습니다.',
            'drama.chal2': '해결: 시각 구조를 이해하는 VLM 기반 파싱으로 전환해 WER를 20%에서 7%로 낮췄습니다.',
            'drama.chal3': '문맥 추론 저하: 데이터 부족과 과도한 장르별 프롬프트 세분화로 F1이 0.2 수준에 머물렀습니다.',
            'drama.chal4': '해결: 한국어 이해도가 높은 Reasoning Model 벤치마킹과 프롬프트 단순화로 F1을 0.5까지 개선했습니다.',
            'drama.result1': '성과: 복잡한 레이아웃 문서에서도 안정적으로 동작하는 대본 파싱 파이프라인을 구축했습니다.',
            'drama.result2': '성과: 핵심 지표를 WER 20%→7%, F1 0.2→0.5로 개선해 분석 신뢰도를 높였습니다.',
            'drama.result3': '성과: 수작업 검토 시간을 크게 줄이고 데이터 기반 콘텐츠 평가 프로세스를 정착시켰습니다.',
            'drama.result4': '인사이트: 복잡한 에이전트 시스템일수록 Data-Centric 접근과 단순한 프롬프트 설계가 성능 향상에 더 효과적임을 확인했습니다.',

            // tiny-chatbot-agents
            'chatbot.overview': '금융 서비스 FAQ와 이용약관(ToS) 기반으로 정확한 응답을 제공하는 금융 도메인 특화 RAG 에이전트를 개발했습니다. QnA 우선 검색 + 약관 정밀 검색의 Dual-Stage 파이프라인으로 속도와 정확도를 동시에 확보했습니다.',
            'chatbot.problem': '문제: 사용자 용어와 약관 용어 간 의미 간극, 유사 조항 혼동, 환각 응답으로 인해 금융 도메인 챗봇의 신뢰성과 검색 정확도가 낮았습니다.',
            'chatbot.goal1': '목표 1: FAQ 우선 검색 후 약관 심화 검색으로 이어지는 이중 단계 검색 구조를 구축합니다.',
            'chatbot.goal2': '목표 2: 하이브리드 검색과 Cross-Encoder 재랭킹으로 조항 단위 정밀 검색 성능을 높입니다.',
            'chatbot.goal3': '목표 3: 환각 검증과 자동 평가 체계를 도입해 답변 신뢰성을 정량 관리합니다.',
            'chatbot.feat1': 'Dual-Stage RAG: Stage 1에서 FAQ를 빠르게 검색하고, 실패 시 Stage 2에서 ToS 전문을 정밀 탐색합니다.',
            'chatbot.feat2': 'Hybrid Search + Reranking: 벡터/키워드/메타데이터 결합 검색과 Cross-Encoder 재정렬로 문맥 적합도를 개선했습니다.',
            'chatbot.feat3': 'Hallucination Verifier: 생성 답변이 검색 근거에 기반하는지 Self-Check하는 검증 에이전트를 구현했습니다.',
            'chatbot.feat4': 'LLM Judge 평가: Accuracy, Faithfulness, Completeness 지표와 Adversarial 시나리오를 포함한 자동 채점 파이프라인을 구축했습니다.',
            'chatbot.feat5': 'MCP 확장성: Model Context Protocol을 적용해 에이전트가 필요 시 도구를 호출하는 워크플로우를 구현했습니다.',
            'chatbot.feat6': '로컬 추론 환경: vLLM/Ollama 기반으로 외부 전송 없이 동작 가능한 보안 친화형 구성을 완성했습니다.',
            'chatbot.chal1': '용어 불일치: 사용자 질문 용어(예: 환불)와 약관 용어(예: 청약 철회)가 달라 검색 누락이 발생했습니다.',
            'chatbot.chal2': '문맥 혼동: 일반 해지와 직권 해지처럼 유사 조항이 혼재되어 잘못된 근거 문서가 선택되는 문제가 있었습니다.',
            'chatbot.chal3': '해결: 벡터/키워드 점수를 가중 합산하는 Hybrid Search와 Cross-Encoder 재랭킹을 도입했습니다.',
            'chatbot.chal4': '결과: 단순 벡터 검색 대비 Top-5 Recall을 약 20% 향상시키고 최종 답변 정확도를 개선했습니다.',
            'chatbot.result1': '성과: 단순 Retrieve-Generate를 넘어 Retrieve-Verify-Evaluate 전체 엔지니어링 사이클을 구축했습니다.',
            'chatbot.result2': '성과: Top-5 Recall 약 20% 개선과 함께 금융 도메인 질의 응답 신뢰도를 높였습니다.',
            'chatbot.result3': '성과: MCP 기반 구조로 향후 도구 확장과 에이전트 오케스트레이션 유연성을 확보했습니다.',
            'chatbot.result4': '학습: 평가셋과 자동 지표를 기반으로 품질을 관리하는 Data-Centric 개발 프로세스를 정착시켰습니다.',

            // tiny-graph-rag
            'graphrag.overview': '비정형 문서에서 엔티티와 관계를 추출해 지식 그래프를 구축하고, 관계 맥락을 반영한 정교한 문맥 검색을 수행하는 Graph-based RAG 시스템을 직접 구현한 프로젝트입니다.',
            'graphrag.problem': '문제: 기존 벡터 검색은 의미 유사도 중심이라 인물·사건·개념 간 관계 구조를 반영한 추론에 한계가 있습니다.',
            'graphrag.goal1': '목표 1: 외부 Graph 프레임워크 의존 없이 Graph RAG 핵심 로직을 Native로 구현합니다.',
            'graphrag.goal2': '목표 2: 문서로부터 지식 그래프를 자동 생성하고 질의별 최적 서브그래프를 탐색/랭킹합니다.',
            'graphrag.goal3': '목표 3: 관계 기반 문맥 검색으로 멀티홉 질의 응답 품질을 개선합니다.',
            'graphrag.feat1': 'Extraction Engine: LLM으로 Node/Edge를 JSON으로 추출하는 파서를 개발했습니다.',
            'graphrag.feat2': 'Data Modeling: Custom Graph Class와 JSON Persistence를 설계해 그래프 저장/재사용 구조를 구현했습니다.',
            'graphrag.feat3': 'Retrieval & Ranking: Seed Node 기반 BFS 탐색과 중심성/연관성 점수를 결합한 서브그래프 랭킹 로직을 구현했습니다.',
            'graphrag.feat4': 'Visualization: Streamlit + PyVis 대시보드로 그래프 탐색과 RAG 응답 과정을 실시간 확인할 수 있게 했습니다.',
            'graphrag.chal1': '호출 병목: 긴 문서를 청킹해 순차 호출할 때 그래프 구축 시간이 선형적으로 증가했습니다.',
            'graphrag.chal2': '속도 개선: asyncio 기반 비동기 배치 처리로 엔티티 추출 파이프라인 처리량을 높였습니다.',
            'graphrag.chal3': '동일 개체 중복: 김첨지/김씨/남편처럼 동일 인물이 중복 노드로 분리되어 연결성이 떨어졌습니다.',
            'graphrag.chal4': 'Entity Resolution: 규칙 기반 + LLM 기반 Hybrid ER, 유사도 0.75 임계치, 관계 충돌 검사로 중복 노드를 50개에서 15개로 줄였습니다.',
            'graphrag.result1': '성과: 전처리-그래프 구축-검색-생성까지 Graph RAG 전 과정을 End-to-End로 자체 구현했습니다.',
            'graphrag.result2': '성과: ER 고도화로 중복 노드를 약 70% 줄여 그래프 밀도와 검색 정확도를 개선했습니다.',
            'graphrag.result3': '성과: 단순 텍스트 검색에서 놓치던 숨겨진 관계를 시각적으로 탐색하고 답변에 반영할 수 있었습니다.',
            'graphrag.result4': '학습: Graph RAG 성능은 모델 자체보다 Entity Resolution 등 전처리 품질에 크게 좌우됨을 확인했습니다.',

            // Medical Image Classification
            'medimg.overview': '맞춤형 CNN 아키텍처와 Vision Transformer(ViT)를 탐색한 딥러닝 기반 의료 이미지 분류 프로젝트입니다. X-ray 이미지 분류에 집중하고 데이터 증강 및 불균형 처리 기술을 구현합니다.',
            'medimg.problem': '문제: 의료 이미지 분류는 라벨링된 데이터 부족, 클래스 불균형, 의료 진단에 필요한 높은 정확도 등 독특한 과제에 직면합니다.',
            'medimg.goal1': '목표 1: 의료 이미지 분류를 위한 CNN과 ViT 아키텍처 비교 평가.',
            'medimg.goal2': '목표 2: 의료 영상의 제한된 라벨링 데이터를 다루기 위한 효과적인 데이터 증강 전략 개발.',
            'medimg.goal3': '목표 3: 의료 데이터셋에서 일반적인 클래스 불균형 문제 해결.',
            'medimg.feat1': 'CNN 아키텍처: 의료 이미지에 최적화된 맞춤형 Convolutional Neural Network 설계 및 구현.',
            'medimg.feat2': 'ViT 탐색: Vision Transformer 아키텍처를 적용하고 CNN과 성능 비교.',
            'medimg.feat3': '데이터 증강: 회전, 뒤집기, 밝기 조정 등 의료 이미지에 적합한 증강 기술 구현.',
            'medimg.feat4': '불균형 처리: 가중치 손실 함수, 오버샘플링 등 클래스 불균형 해결 기술 적용.',
            'medimg.chal1': '데이터 부족: 라벨링된 의료 이미지가 제한적. 데이터 증강과 전이 학습으로 보완.',
            'medimg.chal2': '클래스 불균형: 특정 질병 클래스가 희소. 가중치 손실과 오버샘플링 기술로 해결.',
            'medimg.chal3': '모델 해석성: 의료 진단은 모델 결정에 대한 설명 필요. GradCAM 시각화로 모델 주목 영역 분석.',
            'medimg.chal4': '일반화 성능: 학습 데이터와 다른 도메인에서의 성능 저하. 다양한 데이터 소스와 정규화 기술 적용.',
            'medimg.result1': '분류 성능: CNN과 ViT 모두 높은 정확도 달성, ViT가 일부 케이스에서 더 나은 성능.',
            'medimg.result2': '데이터 효율성: 증강 기술이 제한된 데이터에서 모델 성능 크게 향상.',
            'medimg.result3': '해석 가능한 결과: GradCAM 시각화가 모델이 올바른 영역에 주목하고 있음을 확인.',
            'medimg.result4': '주요 학습: 의료 이미지 분석, 데이터 불균형 처리, 모델 해석성 기술에 대한 전문성 획득.',

            // Synthetic OCR Image Generator
            'ocr.overview': '비영어/중국어권 언어를 위한 OCR 벤치마크를 합성하고 평가하는 End-to-End 파이프라인입니다. 폰트 기반 합성만으로 저자원 언어 OCR 성능을 정량 평가할 수 있는 체계를 구축했습니다.',
            'ocr.problem': '문제: 기존 OCR 벤치마크는 영어/중국어 편향이 강하고, 저자원 언어 실데이터 수집·정제·라벨링 비용이 매우 큽니다.',
            'ocr.goal1': '목표 1: 폰트/템플릿 교체만으로 다양한 언어 OCR 벤치마크를 즉시 생성하는 파이프라인을 구현합니다.',
            'ocr.goal2': '목표 2: 생성 데이터 기반 자동 평가 시스템으로 모델 성능을 객관적으로 측정합니다.',
            'ocr.goal3': '목표 3: Adversarial 시나리오까지 포함해 기존 벤치마크보다 변별력 높은 테스트 환경을 만듭니다.',
            'ocr.feat1': '합성 엔진 이중화: Pillow(고속)와 Headless Chromium(고정밀 웹 렌더링)을 함께 지원하고, Markdown 컴포넌트(Text/Formula/Table)를 Merge해 문서 이미지를 생성했습니다.',
            'ocr.feat2': '코퍼스 확장: Faker와 LLM을 결합해 기업명·인명·상품명 등 도메인별 텍스트를 동적으로 생성했습니다.',
            'ocr.feat3': 'Adversarial Noise Injection: 시각적으로 유사한 문자 쌍을 의도적으로 주입해 OCR 모델 변별력을 검증했습니다.',
            'ocr.feat4': '자동화 벤치마크: OmniDocBench 방식의 영역별 지표(Text/Table/Formula)와 config.yaml + uv 기반 재현 가능한 실험 환경을 구축했습니다.',
            'ocr.chal1': '연산량 폭증: 한글 1만자 기준 전체 SSIM 계산은 O(N^2)로 약 1e8 연산이 필요해 비현실적이었습니다.',
            'ocr.chal2': '2단계 필터링: 8x8 임베딩 Dot Product로 후보를 줄이고, 32x32 SSIM 정밀 비교를 수행해 연산량을 크게 줄였습니다.',
            'ocr.chal3': '다양성 병목: 하드코딩 템플릿 중심 생성은 데이터 중복과 패턴 편향을 유발했습니다.',
            'ocr.chal4': '해결: Rule-based + LLM 하이브리드 텍스트 생성과 재귀적 수식 조합 로직으로 데이터 분포 다양성을 확장했습니다.',
            'ocr.result1': '성과: 합성 데이터만으로 저자원 언어 OCR 성능을 즉시 평가할 수 있는 Scalable Benchmark System을 구축했습니다.',
            'ocr.result2': '성과: 유사 문자 기반 노이즈 주입으로 Edge-case 중심의 고변별 평가 시나리오를 확보했습니다.',
            'ocr.result3': '성과: 언어 설정 변경만으로 다국어 확장이 가능한 유연한 아키텍처를 완성했습니다.',
            'ocr.result4': '학습: Sim-to-Real Gap과 문서 레이아웃 다양성의 중요성을 확인했고, 향후 물리 노이즈 및 레이아웃 고도화 방향을 도출했습니다.',

            // Application Projects
            // Pomodoro
            'pomodoro.overview': '포모도로 기법(25분 집중, 5분 휴식)을 기반으로 한 시간 관리 서비스입니다. 구조화된 작업과 휴식 사이클을 통해 사용자의 생산성 유지를 돕습니다.',
            'pomodoro.feat1': '포모도로 타이머 - 25분 집중 세션',
            'pomodoro.feat2': '휴식 타이머 - 5분 휴식 시간',
            'pomodoro.feat3': '세션 기록 - 완료된 포모도로 추적',
            'pomodoro.feat4': '크로스 플랫폼 - 웹과 모바일 모두 지원',

            // Delivery
            'delivery.overview': '배달 기사가 아파트 공동현관 비밀번호를 저장하고 공유할 수 있는 서비스입니다. 접근 정보 부재로 인한 지연을 줄이는 것이 목표입니다. Android Native(Java)로 처음 개발되었으며, 현재 Flutter로 마이그레이션되어 웹 데모가 제공됩니다.',
            'delivery.feat1': '비밀번호 저장 - 아파트 공동현관 비밀번호를 안전하게 저장',
            'delivery.feat2': '커뮤니티 공유 - 다른 기사들과 접근 정보 공유',
            'delivery.feat3': '빠른 검색 - 주소로 빠르게 검색',
            'delivery.feat4': '오프라인 지원 - 인터넷 연결 없이도 작동',

            // StudyWithMe
            'studywithme.overview': '소규모 학원을 위한 관리 애플리케이션입니다. 학생 데이터, 출석, 선생님 스케줄 관리를 용이하게 합니다.',
            'studywithme.feat1': '학생 관리 - 학생 정보와 진도 추적',
            'studywithme.feat2': '출석 관리 - 간편한 체크인/체크아웃 시스템',
            'studywithme.feat3': '선생님 스케줄링 - 수업 일정 관리',
            'studywithme.feat4': 'Firebase 백엔드 - 실시간 데이터 동기화',

            // Intern/Startup Projects
            // CJ AI Center Intern
            'cj.overview': 'CJ ENM의 AI 센터에서 6개월간 인턴으로 근무했습니다. 한국 드라마 대본 분석을 위한 Multi-Agentic 파이프라인 개발을 담당했습니다.',
            'cj.contrib1': 'LangChain을 활용한 다중 에이전트 드라마 대본 분석 파이프라인 설계 및 구현',
            'cj.contrib2': '대화 추출, 화자 식별, 장면 파싱을 포함한 한국어 NLP 처리 파이프라인 개발',
            'cj.contrib3': '콘텐츠 전략 결정을 위한 구조화된 분석 결과(캐릭터, 플롯, 감정) 생성',
            'cj.contrib4': '배치 처리, 진행 추적, 오류 처리 기능을 갖춘 확장 가능한 시스템 구축',

            // Embedded AI Lab Intern
            'embedded.overview': 'UNIST 임베디드 AI 연구실에서 연구 인턴으로 활동하며 DDPM 논문 리뷰, MNIST 기반 토이 확산 모델 학습, 샘플링 최적화 탐색을 진행했습니다.',
            'embedded.contrib1': 'DDPM(Denoising Diffusion Probabilistic Models) 논문을 리뷰하고 핵심 아이디어를 구현 관점에서 정리',
            'embedded.contrib2': 'MNIST 데이터셋으로 확산 모델을 직접 학습시키는 토이 프로젝트 수행',
            'embedded.contrib3': 'DDIM 샘플링과 Classifier-Free Guidance(CFG)를 적용해 입력 숫자에 해당하는 이미지 생성으로 프로젝트 확장',
            'embedded.contrib4': '타임스텝 샘플링 최적화 관련 연구를 탐색했으나 유의미한 성능 향상은 확인하지 못했고, 첫 이미지 생성 모델 프로젝트 경험을 확보',

            // Troja
            'troja.overview': 'Troja 스타트업에서 풀스택 개발자로 근무했습니다. 차량 예약 및 관리를 위한 Django 기반 웹 플랫폼을 개발했습니다.',
            'troja.contrib1': '딥페이크 모델 서빙(백엔드, NAVER Cloud)',
            'troja.contrib2': 'MVP 웹페이지 제작',

            // Rubisco
            'rubisco.overview': 'Rubisco에서 Flutter 기반 프론트엔드와 백엔드 개발을 맡아 감정 기록 앱(나;다움), 반려견 산책 메이트 매칭 앱(파블로프), 아두이노와 목넘김 센서를 활용한 노인 식사 모니터링 기기까지 프로젝트 전반을 개발했습니다.',
            'rubisco.contrib1': '나;다움 - 감정 기록용 앱 개발',
            'rubisco.contrib2': '파블로프 - 반려견 산책 메이트 매칭 앱 개발',
            'rubisco.contrib3': '해커톤 - 노인분들의 식사 모니터링을 위해 아두이노와 목넘김 센서를 활용한 기기 개발',

            // Legacy Projects
            // Diffusion Model (Legacy)
            'difflegacy.overview': 'tiny-DDPM과 tiny-stable-diffusion의 이전 버전입니다. DDPM과 확산 모델 학습을 위한 초기 구현입니다.',
            'difflegacy.feat1': '기본 DDPM 구현 - 확산 과정 이해를 위한 교육용 코드',
            'difflegacy.feat2': '노이즈 스케줄링 - 선형 및 코사인 스케줄 실험',
            'difflegacy.feat3': 'MNIST 생성 - 숫자 이미지 생성 실험',
            'difflegacy.feat4': '학습 파이프라인 - 간단한 학습 및 샘플링 루프',

            // Mini Graph RAG (Legacy)
            'minigraphrag.overview': 'tiny-graph-rag의 이전 버전입니다. 지식 그래프와 벡터 검색을 결합한 RAG 시스템의 초기 프로토타입입니다.',
            'minigraphrag.feat1': '기본 그래프 구축 - LLM 기반 엔티티 추출',
            'minigraphrag.feat2': '벡터 검색 통합 - 기본적인 하이브리드 검색',
            'minigraphrag.feat3': 'Neo4j 연동 - 그래프 데이터베이스 기본 활용',
            'minigraphrag.feat4': '프로토타입 UI - 간단한 쿼리 인터페이스',

            // AI Interview
            'aiinterview.overview': 'LLM을 활용한 AI 면접 시뮬레이션 서비스입니다. 사용자가 면접 연습을 하고 피드백을 받을 수 있습니다.',
            'aiinterview.feat1': 'AI 면접관 - LLM 기반 면접 질문 생성',
            'aiinterview.feat2': '실시간 피드백 - 답변에 대한 즉각적인 평가',
            'aiinterview.feat3': '다양한 분야 - 기술, 행동, 직무별 면접 지원',
            'aiinterview.feat4': '개선 제안 - 답변 개선을 위한 구체적인 피드백',

            // Gomoku MCP
            'gomoku.overview': 'Model Context Protocol(MCP)를 사용하여 LLM과 오목 게임을 할 수 있는 서버입니다. Claude Desktop과 연동하여 AI와 대전할 수 있습니다.',
            'gomoku.feat1': 'MCP 서버 - Claude Desktop 호환 프로토콜 구현',
            'gomoku.feat2': '게임 로직 - 오목 규칙 및 승패 판정',
            'gomoku.feat3': '시각화 - 텍스트 기반 보드 렌더링',
            'gomoku.feat4': 'AI 대전 - LLM과 함께 게임 플레이'
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
        'pub.kormedmcqa.desc': 'Multi-Choice Question Answering Benchmark for Korean Healthcare Professional Licensing Examinations',
        'exp.cj.desc': 'Developed a Korean Drama script analysis pipeline using a Multi-Agentic pipeline (LangChain).',
        'exp.embedded.desc': 'Conducted research on optimization methods in the inference step of diffusion models.',
        'tab.aiml': 'AI/ML',
        'tab.applications': 'Applications',
        'tab.startup': 'Startup & Interns',
        'award.awards': 'Awards',
        'award.awards.desc': 'Graduated 1st and entered UNIST with Unistar Scholarships',
        'award.teaching': 'Teaching',
        'award.teaching.desc': 'TA in AI Intro and Programming 1',
        'footer.rights': '\u00a9 2026 Junyeong Song. All rights reserved.',
        'hero.vision': 'Hi, I\'m Junyeong Song.<br><br>I\'m deeply interested in AI/ML, especially in areas such as OCR, synthetic dataset creation, agentic pipelines, and image generation models.<br><br>Beyond implementing models, I care about how technology can create real, practical value. Whenever I learn something new, I naturally start asking, "What\'s beyond this?" or "How can this be turned into something impactful?" That curiosity consistently drives me to explore further.<br><br>What motivates me most is fun and curiosity. I genuinely enjoy the learning process itself, and that sense of excitement pushes me to think deeper and build more meaningful systems.',
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
        'drama.overview': 'Built a multi-agent pipeline that quantitatively analyzes drama scripts for storyline quality, character appeal, and commercial potential to support production decisions.',
        'drama.problem': 'Problem: Manual review of episodes 1-4 is expensive, slow, and subjective, creating review bottlenecks and bias.',
        'drama.goal1': 'Goal 1: Automate script analysis with objective metrics through a multi-agent system.',
        'drama.goal2': 'Goal 2: Robustly parse diverse script formats including PDF, HWP, and DOCX.',
        'drama.goal3': 'Goal 3: Improve both OCR quality (WER) and scene-classification quality (F1) for practical adoption.',
        'drama.feat1': 'Multi-format Parser: Implemented preprocessing modules that convert PDF/HWP/DOCX scripts into structured text.',
        'drama.feat2': 'VLM Upgrade: Adopted Qwen2.5-7B-VL to handle Korean OCR and complex multi-column layouts more reliably.',
        'drama.feat3': 'Scene Analysis Agent: Built scene-level strength/weakness classification with CoT prompting for contextual reasoning.',
        'drama.feat4': 'System Orchestration: Connected parser/analyzer/evaluator agents with LangChain workflow control.',
        'drama.feat5': 'Evaluation Framework: Combined OCR and classification benchmarks to track data reliability and model performance.',
        'drama.chal1': 'OCR Limitation: Traditional OCR showed high Korean WER (>20%) and ordering errors on multi-column scripts.',
        'drama.chal2': 'OCR Fix: Switched to VLM-based parsing and reduced WER from 20% to 7%.',
        'drama.chal3': 'Low Reasoning F1: Sparse data and over-segmented genre prompts led to F1 around 0.2.',
        'drama.chal4': 'Reasoning Fix: Benchmarked Korean-strong reasoning models and simplified prompts, improving F1 to 0.5.',
        'drama.result1': 'Result: Delivered a robust script parsing pipeline for highly unstructured production documents.',
        'drama.result2': 'Result: Improved key metrics significantly (WER 20%->7%, F1 0.2->0.5).',
        'drama.result3': 'Result: Reduced manual review load and enabled more data-driven content evaluation workflow.',
        'drama.result4': 'Learning: Confirmed that data-centric evaluation and simpler prompting outperform over-constrained prompt design.',

        // tiny-chatbot-agents
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
        'ocr.overview': 'Built an end-to-end synthetic OCR benchmark pipeline for non-English/non-Chinese languages, enabling quantitative evaluation without expensive real-data labeling.',
        'ocr.problem': 'Problem: Existing OCR benchmarks are language-biased and validating low-resource languages with real data is costly and slow.',
        'ocr.goal1': 'Goal 1: Generate OCR benchmark datasets instantly by swapping fonts, templates, and language settings.',
        'ocr.goal2': 'Goal 2: Build an automated metric pipeline to evaluate recognition quality objectively.',
        'ocr.goal3': 'Goal 3: Include adversarial edge-case scenarios for stronger model discrimination testing.',
        'ocr.feat1': 'Dual Rendering Engines: Combined Pillow for fast generation and headless Chromium for high-fidelity web-rendered markdown documents.',
        'ocr.feat2': 'Corpus Expansion: Used Faker + LLM generated text for broader domain coverage of names, entities, and product-like strings.',
        'ocr.feat3': 'Adversarial Similar-Character Injection: Built visual-confusion tests with SSIM-based similar-character pairs.',
        'ocr.feat4': 'Automated Benchmarking: Added region-specific metrics (text/table/formula) with reproducible config.yaml + uv environments.',
        'ocr.chal1': 'Compute Explosion: Full SSIM pairwise comparisons over ~10k Korean characters caused O(N^2) scale issues.',
        'ocr.chal2': 'Optimization: Designed 2-stage filtering (8x8 coarse embedding + 32x32 fine SSIM) to reduce runtime drastically.',
        'ocr.chal3': 'Diversity Bottleneck: Hardcoded templates produced repetitive patterns and duplicate samples.',
        'ocr.chal4': 'Fix: Introduced hybrid text generation and recursive formula composition for richer distributional diversity.',
        'ocr.result1': 'Result: Delivered a scalable benchmark system for low-resource language OCR using synthetic data only.',
        'ocr.result2': 'Result: Secured high-discriminative edge-case tests via adversarial noise injection.',
        'ocr.result3': 'Result: Enabled multilingual expansion through configuration changes rather than pipeline rewrites.',
        'ocr.result4': 'Learning: Identified sim-to-real and layout-diversity gaps as key next research directions.',

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
        'troja.overview': 'Worked as a full-stack developer at Troja startup. Developed Django-based web platform for vehicle reservation and management.',
        'troja.contrib1': 'Deepfake model serving (backend, NAVER Cloud)',
        'troja.contrib2': 'Built the MVP web page',

        // Rubisco
        'rubisco.overview': 'Led Flutter-based frontend and backend development across mobile and hardware projects, including an emotion journaling app (Na;Daum), a pet-walking mate matching app (Pavlov), and an Arduino meal-monitoring device with a swallowing sensor for elderly users.',
        'rubisco.contrib1': 'Na;Daum - Developed an emotion journaling app',
        'rubisco.contrib2': 'Pavlov - Built a pet-walking mate matching app',
        'rubisco.contrib3': 'Hackathon - Built a device using Arduino and a swallowing sensor to monitor elderly meal intake',

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

        // AI Interview
        'aiinterview.overview': 'AI interview simulation service using LLM. Users can practice interviews and receive feedback.',
        'aiinterview.feat1': 'AI Interviewer - LLM-based interview question generation',
        'aiinterview.feat2': 'Real-time Feedback - Immediate evaluation of answers',
        'aiinterview.feat3': 'Multiple Domains - Technical, behavioral, and role-specific interviews',
        'aiinterview.feat4': 'Improvement Suggestions - Specific feedback for answer improvement',

        // Gomoku MCP
        'gomoku.overview': 'A server that allows playing Gomoku with LLM using Model Context Protocol (MCP). Works with Claude Desktop for AI battles.',
        'gomoku.feat1': 'MCP Server - Claude Desktop compatible protocol implementation',
        'gomoku.feat2': 'Game Logic - Gomoku rules and win/lose determination',
        'gomoku.feat3': 'Visualization - Text-based board rendering',
        'gomoku.feat4': 'AI Battle - Play games with LLM'
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
