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
            'hero.vision': '<strong>비전:</strong> 세상에 대한 끝없는 호기심과 끊임없는 배움의 즐거움을 원동력으로, 금전적 이익보다 타인에 대한 의미 있는 기여로 정의되는 삶을 추구합니다.',
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
            'medllm.overview': '종합적인 의료 데이터셋을 구축하고 rtzr/ko-gemma-2-9b-it 모델을 파인튜닝하여 한국 의료 도메인 특화 LLM을 개발했습니다. 의료 윤리와 안전 가이드라인을 준수하면서 한국 의료 면허 시험 문제에 답변할 수 있는 모델 구축에 집중했습니다. 이 연구는 KorMedMCQA 벤치마크 연구에 기여했습니다.',
            'medllm.problem': '문제: 기존 LLM은 한국 의료 분야 전문 지식이 부족하여, 의료 면허 시험과 의료 질의응답 작업에서 저조한 성능을 보입니다.',
            'medllm.goal1': '목표 1: 다양한 권위 있는 출처에서 고품질 한국 의료 데이터셋을 수집하고 구축합니다.',
            'medllm.goal2': '목표 2: KorMedMCQA 벤치마크에서 경쟁력 있는 성능을 달성하도록 한국어 LLM을 파인튜닝합니다.',
            'medllm.goal3': '목표 3: 윤리적으로 건전하고 의학적으로 정확한 응답을 생성하도록 합니다.',
            'medllm.feat1': '다중 소스 데이터셋 큐레이션: KorMedMCQA, MedExpQA(번역), UltraMed, COD(임상 관찰 데이터), 서울아산병원 질병 사전에서 데이터를 수집했습니다.',
            'medllm.feat2': '데이터 품질 관리: 의료 정확성을 보장하고 잠재적으로 유해한 콘텐츠를 제거하기 위한 엄격한 필터링 및 검증 프로세스를 구현했습니다.',
            'medllm.feat3': '파인튜닝 파이프라인: LoRA 및 QLoRA를 사용한 파라미터 효율적 파인튜닝을 위해 HuggingFace Transformers 기반의 효율적인 학습 파이프라인을 개발했습니다.',
            'medllm.feat4': '평가 프레임워크: 임상 지식, 진단, 치료 권장 사항 등 여러 의료 도메인을 포괄하는 종합 평가 체계를 구축했습니다.',
            'medllm.chal1': '데이터 부족: 한국 의료 학습 데이터가 제한적이었습니다. 질병 사전 크롤링, 영어 의료 데이터셋 번역, 기존 한국어 소스 보강으로 해결했습니다.',
            'medllm.chal2': '도메인 적응: 범용 LLM이 의료 용어에 어려움을 겪었습니다. 태스크별 파인튜닝 전에 의료 코퍼스에 대한 계속 사전학습을 적용했습니다.',
            'medllm.chal3': '윤리적 고려: 의료 응답은 안전에 중요한 정보의 신중한 처리가 필요합니다. 응답 필터링을 구현하고 의료 조언에 대한 적절한 면책 조항을 추가했습니다.',
            'medllm.chal4': '평가 일관성: 의료 QA 평가에는 도메인 전문 지식이 필요했습니다. 신뢰할 수 있는 비교를 위해 표준화된 채점 방법론과 함께 KorMedMCQA 벤치마크를 사용했습니다.',
            'medllm.result1': '벤치마크 성능: KorMedMCQA 벤치마크에서 베이스라인 대비 상당한 개선을 달성하여 효과적인 도메인 적응을 입증했습니다.',
            'medllm.result2': '모델 공개: 커뮤니티 사용 및 추가 연구를 위해 HuggingFace에 파인튜닝된 모델을 공개했습니다.',
            'medllm.result3': '연구 기여: 출판 승인된 KorMedMCQA 논문에 기여하여 한국 의료 NLP 연구 발전에 이바지했습니다.',
            'medllm.result4': '주요 학습: 도메인 특화 LLM 파인튜닝, 의료 NLP 과제, 의료 애플리케이션에서의 책임감 있는 AI 개발의 중요성에 대한 전문성을 습득했습니다.',

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
            'bilingual.overview': '제주 방언과 표준 한국어 간의 양방향 번역 모델을 개발하여 AI 기술을 통한 위기 지역 언어 보존 문제를 해결했습니다. Full 파인튜닝, LoRA, QLoRA(4-bit) 등 다양한 파인튜닝 방법론을 탐색하여 번역 품질과 계산 효율성의 최적 균형을 찾았습니다.',
            'bilingual.problem': '문제: 제주 방언은 유네스코에 의해 심각하게 위기에 처한 언어로 분류됩니다. 젊은 세대가 전통 제주어를 이해하는 데 어려움을 겪어 문화 유산 손실로 이어지고 있습니다.',
            'bilingual.goal1': '목표 1: 제주 방언과 표준 한국어 간의 정확한 양방향 번역 시스템을 구축합니다.',
            'bilingual.goal2': '목표 2: 인코더-디코더 번역 모델에 대한 다양한 파인튜닝 방법(Full, LoRA, QLoRA)을 비교합니다.',
            'bilingual.goal3': '목표 3: 한국 방언 보존 노력을 지원하기 위한 재사용 가능한 데이터셋과 모델을 생성합니다.',
            'bilingual.feat1': '데이터셋 준비: AIhub "한국어 방언 발화(제주)" 데이터셋을 처리하여 seq2seq 학습에 적합한 병렬 코퍼스를 생성했습니다.',
            'bilingual.feat2': '다중 모델 비교: 번역 품질을 위해 KoT5와 KoBART 아키텍처를 모두 평가했습니다.',
            'bilingual.feat3': '파라미터 효율적 파인튜닝: LoRA와 QLoRA(4-bit)를 구현하여 품질을 유지하면서 리소스 제약 환경에서 학습을 가능하게 했습니다.',
            'bilingual.feat4': '종합적 평가: 다양한 접근법의 체계적인 비교를 위해 BLEU 및 ROUGE 점수를 사용한 평가 파이프라인을 구축했습니다.',
            'bilingual.feat5': '공개 배포: 커뮤니티 사용을 위해 처리된 데이터셋을 HuggingFace에 공개했습니다.',
            'bilingual.chal1': '저자원 언어: 제주 방언 학습 데이터가 제한적이었습니다. 데이터 증강 기술을 적용하고 표준 한국어 모델로부터 전이 학습을 활용했습니다.',
            'bilingual.chal2': '방언 변이성: 제주 방언은 섬 내에서도 상당한 지역적 변이가 있습니다. 데이터셋에서 지역적 다양성을 보존하면서 가장 일반적인 패턴에 집중했습니다.',
            'bilingual.chal3': '인코더-디코더 복잡성: Seq2seq 모델은 신중한 하이퍼파라미터 튜닝이 필요했습니다. 체계적인 하이퍼파라미터 검색과 함께 HuggingFace의 Seq2SeqTrainer를 사용했습니다.',
            'bilingual.chal4': '양자화 트레이드오프: 4-bit QLoRA는 일부 품질 저하를 보였습니다. 실용적인 배포 결정을 안내하기 위해 효율성과 품질 간의 트레이드오프를 문서화했습니다.',
            'bilingual.result1': '번역 품질: 효과적인 방언-표준어 번역 능력을 보여주는 경쟁력 있는 BLEU 점수를 달성했습니다.',
            'bilingual.result2': '효율성 분석: LoRA는 90% 적은 학습 가능 파라미터로 Full 파인튜닝에 가까운 품질을 달성했습니다.',
            'bilingual.result3': '문화적 영향: 세대 간 언어 격차를 해소하고 제주 방언 보존 노력을 지원할 수 있는 도구를 만들었습니다.',
            'bilingual.result4': '주요 학습: 저자원 NLP, 파라미터 효율적 파인튜닝, 위기 언어 보존 작업의 고유한 과제에 대한 실무 경험을 얻었습니다.',

            // tiny-DDPM
            'ddpm.overview': '확산 모델의 수학과 아키텍처에 대한 깊은 이해를 위해 설계된 DDPM(Denoising Diffusion Probabilistic Models)의 처음부터 구현입니다. 설정 기반 관리, 다중 모델 아키텍처(UNet, DiT), 포괄적인 테스트, DDIM 및 Classifier-Free Guidance를 포함한 최신 샘플링 방법을 지원합니다.',
            'ddpm.problem': '문제: 많은 확산 모델 구현이 너무 복잡하거나 너무 단순화되어 있습니다. 교육적이면서도 프로덕션 품질의 코드베이스가 필요했습니다.',
            'ddpm.goal1': '목표 1: 순방향/역방향 확산 과정과 노이즈 스케줄링을 깊이 이해하기 위해 원본 논문을 따라 DDPM을 처음부터 구현합니다.',
            'ddpm.goal2': '목표 2: 빠른 샘플링을 위한 DDIM과 조건부 생성을 위한 Classifier-Free Guidance를 포함한 고급 기술로 확장합니다.',
            'ddpm.goal3': '목표 3: 추가 확산 모델 연구의 기반이 될 수 있는 유지보수 가능하고 테스트 가능한 코드를 만듭니다.',
            'ddpm.feat1': '다중 모델 아키텍처: 아키텍처 접근법을 비교하기 위해 전통적인 UNet과 최신 Diffusion Transformer(DiT)를 모두 구현했습니다.',
            'ddpm.feat2': '설정 기반 관리: YAML 설정 파일을 통한 모든 하이퍼파라미터 관리로 재현 가능한 실험과 쉬운 파라미터 스윕을 가능하게 합니다.',
            'ddpm.feat3': '고급 샘플링: DDPM 대비 10-50배 빠른 샘플링을 위한 DDIM 구현과 제어 가능한 생성 품질을 위한 CFG.',
            'ddpm.feat4': 'Apple Silicon 지원: Apple M-시리즈 칩에서 GPU 가속을 위한 자동 MPS 감지.',
            'ddpm.feat5': '포괄적인 테스트: 노이즈 스케줄링, 순방향/역방향 과정, 모델 출력의 정확성을 보장하는 pytest 기반 단위 테스트.',
            'ddpm.chal1': '분산 스케줄링: 베타 스케줄과 생성 품질 간의 수학적 관계 이해. 선형, 코사인, 학습된 스케줄을 구현하고 절제 연구를 수행했습니다.',
            'ddpm.chal2': '타임스텝 임베딩: 적절한 사인파 임베딩 구현이 모델 성능에 중요했습니다. 참조 구현과 비교하고 임베딩을 시각화하여 디버깅했습니다.',
            'ddpm.chal3': '메모리 효율성: 긴 확산 체인이 메모리 문제를 일으켰습니다. 소비자 GPU에서 학습을 위해 그래디언트 체크포인팅을 구현하고 배치 크기를 최적화했습니다.',
            'ddpm.chal4': 'DiT 통합: 이미지 생성을 위한 트랜스포머 아키텍처 적응에는 신중한 패치 임베딩과 위치 인코딩 설계가 필요했습니다.',
            'ddpm.result1': '성공적인 생성: 학습된 모델이 적절한 모드 커버리지로 다양하고 고품질의 MNIST 숫자를 성공적으로 생성합니다.',
            'ddpm.result2': '샘플링 속도: DDIM이 10배 적은 스텝으로 비슷한 품질을 달성하여 생성 시간을 획기적으로 단축했습니다.',
            'ddpm.result3': '교육적 가치: 코드베이스가 각 단계의 수학을 설명하는 상세한 주석과 함께 포괄적인 학습 리소스로 활용됩니다.',
            'ddpm.result4': '주요 학습: 점수 기반 생성 모델, 노이즈 예측 네트워크, 확산과 점수 매칭의 연결에 대한 깊은 이해를 얻었습니다.',

            // tiny-stable-diffusion
            'sd.overview': 'PyTorch로 처음부터 구축한 경량 교육용 Stable Diffusion 3(SD3) 구현입니다. 2억 파라미터 모델로 Rectified Flow와 MMDiT 아키텍처를 사용하여 64×64 이미지와 애니메이션 GIF를 생성합니다.',
            'sd.problem': '문제: 최신 Stable Diffusion 모델은 소비자 하드웨어에서 학습하거나 연구하기에 너무 큽니다.',
            'sd.goal1': '목표 1: 단일 소비자 GPU에서 학습 가능하면서 핵심 아키텍처를 캡처하는 축소된 SD3 구현 생성.',
            'sd.goal2': '목표 2: VAE, 텍스트 인코더(CLIP, T5), MMDiT를 포함한 완전한 파이프라인을 처음부터 구현.',
            'sd.goal3': '목표 3: 시간적 일관성을 보여주는 모션 모듈을 사용하여 비디오/GIF 생성으로 확장.',
            'sd.feat1': 'MMDiT 아키텍처: 양방향 어텐션으로 이미지와 텍스트 임베딩을 공동 처리하는 Multi-Modal Diffusion Transformer 구현.',
            'sd.feat2': 'Rectified Flow: 더 직선적인 샘플링 궤적과 더 적은 스텝을 위해 전통적인 DDPM 대신 최신 Flow 기반 공식 사용.',
            'sd.feat3': '완전한 파이프라인: VAE 인코더/디코더, CLIP 및 T5 텍스트 조건화, 전체 디노이징 파이프라인 구축.',
            'sd.feat4': '모션 모듈: 일관된 모션으로 애니메이션 GIF를 생성하기 위한 시간적 어텐션 레이어 추가.',
            'sd.feat5': '교육적 설계: 각 컴포넌트에 대한 단계별 설명이 있는 깔끔하고 주석이 잘 달린 코드베이스.',
            'sd.chal1': '메모리 제약: 전체 SD3는 대용량 GPU 메모리 필요. 신중한 절제 연구를 통해 아키텍처 혁신을 보존하면서 모델 크기 축소.',
            'sd.chal2': 'VAE 학습 안정성: VAE 학습이 후방 붕괴 문제 발생. 안정적인 학습을 위해 KL 어닐링과 지각 손실 균형 구현.',
            'sd.chal3': '텍스트-이미지 정렬: 약한 조건화로 프롬프트 따르기가 부실. Classifier-Free Guidance와 개선된 크로스 어텐션 메커니즘 사용.',
            'sd.chal4': '모션 일관성: 초기 모션 모듈이 깜빡이는 비디오 생성. 부드러운 전환을 위해 시간적 어텐션 레이어 추가하고 비디오 데이터셋으로 학습.',
            'sd.result1': '성공적인 생성: 모델이 64×64 해상도에서 인식 가능한 콘텐츠로 텍스트 프롬프트에서 일관된 이미지 생성.',
            'sd.result2': '학습 효율성: 전체 모델이 단일 RTX 3090에서 합리적인 시간에 학습 가능하여 확산 모델 연구를 대중화.',
            'sd.result3': '교육적 영향: 코드베이스가 최신 확산 아키텍처를 배우는 다른 사람들을 위한 참고 자료로 활용.',
            'sd.result4': '주요 학습: SD3 아키텍처, Rectified Flow 이론, 멀티모달 트랜스포머, 비디오 생성 기술에 대한 포괄적인 이해 획득.',

            // Drama Analysis Pipeline
            'drama.overview': 'CJ AI Center 인턴십에서 개발한 이 프로젝트는 LangChain을 사용하여 한국 드라마 대본을 분석하기 위한 정교한 Multi-Agentic 파이프라인을 생성합니다. 데이터 기반 콘텐츠 전략 결정을 가능하게 합니다.',
            'drama.problem': '문제: 드라마 대본을 수동으로 분석하는 것은 시간이 많이 걸리고 주관적입니다. 콘텐츠 팀은 대규모 대본 데이터베이스에서 인사이트를 추출하기 위한 자동화되고 일관된 방법이 필요합니다.',
            'drama.goal1': '목표 1: 한국 드라마 대본을 처리하고 캐릭터, 플롯, 테마에 대한 구조화된 정보를 추출하는 자동화된 파이프라인 구축.',
            'drama.goal2': '목표 2: 분석의 다양한 측면(캐릭터 분석, 플롯 요약, 감정 감지)을 처리하는 특수화된 에이전트가 있는 다중 에이전트 아키텍처 구현.',
            'drama.goal3': '목표 3: 콘텐츠 라이브러리 분석을 위해 대본을 배치로 처리할 수 있는 확장 가능한 시스템 생성.',
            'drama.feat1': '다중 에이전트 아키텍처: 캐릭터 분석, 플롯 추출, 감정 태깅, 관계 매핑을 위한 특수화된 에이전트 설계.',
            'drama.feat2': 'LangChain 통합: 커스텀 도구와 메모리 관리를 통한 LangChain의 에이전트 프레임워크를 사용하여 견고한 에이전트 오케스트레이션 구축.',
            'drama.feat3': '한국어 NLP 처리: 대화 추출, 화자 식별, 무대 지시 파싱을 포함한 한국어 특화 텍스트 처리 구현.',
            'drama.feat4': '구조화된 출력: 다운스트림 분석 및 시각화 시스템과 호환되는 JSON 형식 분석 결과 생성.',
            'drama.feat5': '배치 처리: 진행 추적 및 오류 처리를 통한 다중 대본 처리를 위한 파이프라인 설계.',
            'drama.chal1': '대본 형식 변동성: 한국 드라마 대본은 형식이 일관되지 않음. 다양한 형식을 처리하기 위해 정규식 패턴과 휴리스틱을 사용한 견고한 파서 개발.',
            'drama.chal2': '에이전트 조정: 여러 에이전트가 충돌 없이 컨텍스트를 공유해야 함. 공유 메모리 시스템 및 메시지 전달 프로토콜 구현.',
            'drama.chal3': '컨텍스트 길이 제한: 긴 대본이 LLM 컨텍스트 윈도우 초과. 장면 경계에서 지능적 청킹을 사용한 슬라이딩 윈도우 접근법 생성.',
            'drama.chal4': '분석 일관성: 대본 섹션 간 일관된 캐릭터 식별 보장. 전체 대본에서 엔티티 해결 및 캐릭터 추적 구현.',
            'drama.result1': '자동화 달성: 대본 분석 시간을 수 시간의 수동 작업에서 몇 분의 자동화 처리로 단축.',
            'drama.result2': '분석 품질: 콘텐츠 팀이 스토리 패턴과 캐릭터 역학을 이해하는 데 가치 있다고 여기는 구조화된 인사이트 생성.',
            'drama.result3': '인턴십 기여: 엔터테인먼트 산업에서 LLM 기술의 실용적 응용을 보여주는 작동하는 프로토타입 제공.',
            'drama.result4': '주요 학습: 프로덕션 에이전틱 AI 시스템, 엔터프라이즈 LLM 배포, 창작 콘텐츠 도메인에서 한국어 NLP의 고유한 과제에 대한 경험 획득.',

            // tiny-chatbot-agents
            'chatbot.overview': '이중 단계 검색, 하이브리드 검색 기능, 환각 검증을 갖춘 정교한 엔터프라이즈급 RAG 챗봇 시스템입니다. 내부 보안 요구사항을 위해 설계되어 외부 API 호출 없이 로컬 LLM 추론 서버(vLLM, Ollama)와 작동합니다.',
            'chatbot.problem': '문제: 엔터프라이즈 챗봇은 종종 환각에 시달리고 내부 지식 기반을 안전하게 사용할 능력이 부족합니다. 많은 솔루션이 외부 API 호출을 필요로 하여 데이터 프라이버시 우려를 야기합니다.',
            'chatbot.goal1': '목표 1: 회사별 QnA 쌍과 이용약관 문서를 사용하여 질문에 답변할 수 있는 완전 로컬 RAG 시스템 구축.',
            'chatbot.goal2': '목표 2: 복잡한 문서를 검색하기 전에 큐레이트된 답변을 우선시하는 이중 단계 검색 구현.',
            'chatbot.goal3': '목표 3: 모든 답변이 검색된 컨텍스트에 기반하도록 보장하는 환각 검증 추가.',
            'chatbot.feat1': '이중 단계 RAG 파이프라인: 먼저 큐레이트된 QnA 데이터베이스에서 직접 매칭을 검색한 후, 복잡한 쿼리에 대해 ToS 문서 검색으로 폴백.',
            'chatbot.feat2': '하이브리드 검색: 포괄적인 검색을 위해 벡터 검색(E5 임베딩), 규칙 기반 매칭, 지식 그래프 트리플릿 결합.',
            'chatbot.feat3': '고급 랭킹: 빠른 초기 검색을 위한 Bi-Encoder(E5)와 정밀한 재랭킹을 위한 Cross-Encoder(BGE-Reranker)를 사용한 2단계 랭킹.',
            'chatbot.feat4': '환각 검증: 생성된 답변이 검색된 컨텍스트에 의해 지원되는지 확인하는 LLM 기반 검증 단계.',
            'chatbot.feat5': 'MCP 서버 지원: Claude Desktop 호환성을 위한 Model Context Protocol 통합.',
            'chatbot.feat6': '로컬 LLM 준비: OpenAI 호환 API를 통해 vLLM 및 Ollama와 원활하게 작동.',
            'chatbot.chal1': '검색 품질: 단순 벡터 검색이 의미론적 매칭 놓침. 밀집, 희소, 지식 그래프 검색을 결합한 하이브리드 접근법 구현.',
            'chatbot.chal2': '환각 감지: LLM이 자신있게 잘못된 정보 생성. 소스 문서와 답변을 교차 참조하는 검증 에이전트 추가.',
            'chatbot.chal3': '알 수 없는 답변 처리: 시스템이 지식 외부의 쿼리를 우아하게 처리해야 함. 적절한 경우 신뢰도 점수와 명시적인 "모르겠습니다" 응답 구현.',
            'chatbot.chal4': '지연 시간 최적화: 여러 검색 단계가 지연 시간 추가. 캐싱, 병렬 검색, 높은 신뢰도 매칭에 대한 조기 종료 구현.',
            'chatbot.result1': '정확도 향상: 이중 단계 검색이 단일 단계 벡터 검색에 비해 답변 관련성 크게 향상.',
            'chatbot.result2': '환각 감소: 검증 단계가 사용자에게 도달하기 전에 ~85%의 환각 응답을 감지하고 방지.',
            'chatbot.result3': '보안 준수: 완전 로컬 배포가 외부 데이터 전송 없이 엔터프라이즈 보안 요구사항 충족.',
            'chatbot.result4': '주요 학습: 프로덕션 RAG 시스템, 임베딩 모델, 재랭킹 전략, 엔터프라이즈 AI에서 환각 방지의 중요성에 대한 깊은 전문성 획득.',

            // tiny-graph-rag
            'graphrag.overview': 'Neo4j 그래프 데이터베이스와 지식 그래프를 벡터 검색과 결합한 Graph RAG 시스템의 경량 구현입니다. 엔티티 관계와 의미론적 유사성을 모두 활용하여 향상된 컨텍스트 검색을 제공합니다.',
            'graphrag.problem': '문제: 전통적인 RAG 시스템은 연결된 정보가 다른 문서 청크에 분산되어 있을 때 어려움을 겪어 불완전하거나 오해의 소지가 있는 검색으로 이어집니다.',
            'graphrag.goal1': '목표 1: 구조화된 관계와 비구조화된 텍스트를 모두 활용하는 하이브리드 검색 시스템 구축.',
            'graphrag.goal2': '목표 2: 문서에서 자동 지식 그래프 구축을 구현하여 수동 온톨로지 생성 없이 가능하게 함.',
            'graphrag.goal3': '목표 3: 순수 벡터 검색에 비해 멀티홉 추론 쿼리에서 검색 품질 향상.',
            'graphrag.feat1': '자동 그래프 구축: LLM 기반 엔티티 및 관계 추출로 문서를 자동으로 지식 그래프로 변환.',
            'graphrag.feat2': 'Neo4j 통합: 효율적인 그래프 쿼리 및 Cypher 쿼리 지원을 위해 Neo4j 그래프 데이터베이스 활용.',
            'graphrag.feat3': '하이브리드 검색: 그래프 순회와 벡터 유사성 검색을 결합하여 관련 컨텍스트의 포괄적인 검색.',
            'graphrag.feat4': '멀티홉 추론: 여러 관계를 순회해야 하는 복잡한 쿼리 지원.',
            'graphrag.chal1': '엔티티 해결: 동일 엔티티의 다양한 언급 연결. 정규화 및 클러스터링 기반 엔티티 해결 구현.',
            'graphrag.chal2': '관계 추출 품질: LLM 추출 관계에 노이즈가 많음. 필터링 및 검증 단계 추가로 그래프 품질 개선.',
            'graphrag.chal3': '쿼리 복잡성: 그래프와 벡터 검색 균형을 위한 쿼리 최적화 필요. 쿼리 유형에 따른 적응형 라우팅 구현.',
            'graphrag.chal4': '확장성: 대규모 그래프가 느린 쿼리 유발. 인덱싱 및 캐싱 전략으로 성능 최적화.',
            'graphrag.result1': '검색 개선: 그래프 기반 검색이 멀티홉 쿼리에서 순수 벡터 검색 대비 답변 품질 크게 향상.',
            'graphrag.result2': '지식 발견: 그래프 시각화가 문서 간 숨겨진 연결 발견 가능하게 함.',
            'graphrag.result3': '교육적 가치: 구현이 Graph RAG 개념과 실용적 배포 패턴의 학습 참고 자료로 활용.',
            'graphrag.result4': '주요 학습: 지식 그래프 구축, 그래프 데이터베이스 작업, 하이브리드 검색 아키텍처에 대한 전문성 획득.',

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
            'ocr.overview': '자연스럽고 다양한 합성 이미지를 생성하여 OCR 모델 학습 데이터를 제공하는 합성 데이터 생성기입니다. 다양한 폰트, 배경, 노이즈를 적용하여 실제 환경을 시뮬레이션합니다.',
            'ocr.problem': '문제: OCR 모델 학습에는 대량의 라벨링된 텍스트 이미지가 필요하지만, 실제 데이터 수집과 라벨링은 비용이 많이 듭니다. 합성 데이터로 이 문제를 해결할 수 있습니다.',
            'ocr.goal1': '목표 1: OCR 모델 학습에 충분히 현실적인 합성 텍스트 이미지 생성기 개발.',
            'ocr.goal2': '목표 2: 다양한 폰트, 배경, 노이즈를 적용하여 실제 환경의 변동성 시뮬레이션.',
            'ocr.goal3': '목표 3: 대량의 합성 이미지를 효율적으로 생성할 수 있는 파이프라인 구축.',
            'ocr.feat1': '폰트 다양성: 다양한 한글 및 영문 폰트를 지원하여 다양한 문서 스타일 시뮬레이션.',
            'ocr.feat2': '배경 다양성: 단색, 텍스처, 그라데이션 등 다양한 배경 적용.',
            'ocr.feat3': '노이즈 시뮬레이션: 카메라 노이즈, 블러, 왜곡 등 실제 촬영 조건 시뮬레이션.',
            'ocr.feat4': '자동 라벨링: 생성된 이미지에 대한 정확한 텍스트 라벨 자동 생성.',
            'ocr.chal1': '현실성: 합성 이미지가 충분히 현실적이어야 함. 다양한 노이즈와 왜곡 효과 조합으로 현실성 향상.',
            'ocr.chal2': '폰트 렌더링: 한글 폰트의 다양한 스타일 지원. 여러 폰트 라이브러리와 렌더링 옵션 탐색.',
            'ocr.chal3': '데이터 다양성: 생성 데이터가 실제 환경의 변동성을 커버해야 함. 파라미터 랜덤화로 다양성 확보.',
            'ocr.chal4': '생성 효율성: 대량 이미지 생성 시 성능 최적화 필요. 배치 처리와 병렬화로 효율성 향상.',
            'ocr.result1': 'OCR 개선: 합성 데이터로 학습한 모델이 실제 데이터만으로 학습한 모델 대비 성능 향상.',
            'ocr.result2': '데이터 효율성: 라벨링 비용 없이 대량의 학습 데이터 생성 가능.',
            'ocr.result3': '커스터마이징: 특정 도메인(영수증, 문서 등)에 맞춤화된 데이터 생성 가능.',
            'ocr.result4': '주요 학습: 합성 데이터 생성, 이미지 처리, OCR 모델 학습에 대한 전문성 획득.',

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
            'embedded.overview': '울산대학교 임베디드 AI 연구실에서 연구 인턴으로 근무했습니다. 한국 의료 도메인 LLM 연구에 참여했습니다.',
            'embedded.contrib1': 'KorMedMCQA, MedExpQA, 서울아산병원 질병 사전 등 다양한 소스에서 한국 의료 데이터셋 구축',
            'embedded.contrib2': 'LoRA/QLoRA를 사용하여 ko-gemma-2-9b-it 모델 파인튜닝 수행',
            'embedded.contrib3': '출판 승인된 KorMedMCQA 벤치마크 논문에 기여',
            'embedded.contrib4': '의료 응답의 정확성과 윤리적 건전성을 보장하는 평가 프레임워크 개발',

            // Troja
            'troja.overview': 'Troja 스타트업에서 풀스택 개발자로 근무했습니다. 차량 예약 및 관리를 위한 Django 기반 웹 플랫폼을 개발했습니다.',
            'troja.contrib1': 'Django 풀스택 웹 애플리케이션 설계 및 구현',
            'troja.contrib2': '차량 예약 및 관리 시스템 개발',
            'troja.contrib3': '사용자 인증 및 권한 관리 시스템 구축',
            'troja.contrib4': '결제 연동 및 실시간 알림 기능 구현',

            // Rubisco
            'rubisco.overview': 'Rubisco 스타트업에서 ML 인턴으로 근무했습니다. 위성 이미지 분석을 위한 딥러닝 모델 개발에 참여했습니다.',
            'rubisco.contrib1': '위성 이미지 세그멘테이션을 위한 딥러닝 모델 개발',
            'rubisco.contrib2': '데이터 증강 및 전처리 파이프라인 구축',
            'rubisco.contrib3': '모델 성능 최적화 및 추론 속도 개선',
            'rubisco.contrib4': '위성 이미지에서 특정 객체 탐지 알고리즘 연구',

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
        'hero.vision': '<strong>Vision:</strong> Driven by an insatiable curiosity for the world and the joy of continuous learning, I am dedicated to a life defined by meaningful contribution to others rather than financial gain.',
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
        'medllm.overview': 'Developed a specialized Korean medical domain LLM by creating comprehensive healthcare datasets and fine-tuning the rtzr/ko-gemma-2-9b-it model. The project focused on building a model capable of answering Korean medical licensing examination questions while adhering to healthcare domain ethics and safety guidelines. This work contributed to the KorMedMCQA benchmark research.',
        'medllm.problem': 'Problem: Existing LLMs lack specialized knowledge in Korean medical domain, performing poorly on healthcare licensing examinations and medical question-answering tasks.',
        'medllm.goal1': 'Goal 1: Curate and construct high-quality Korean medical datasets from multiple authoritative sources.',
        'medllm.goal2': 'Goal 2: Fine-tune a Korean LLM to achieve competitive performance on KorMedMCQA benchmark.',
        'medllm.goal3': 'Goal 3: Ensure the model provides ethically sound and medically accurate responses.',
        'medllm.feat1': 'Multi-Source Dataset Curation: Aggregated data from KorMedMCQA, MedExpQA (translated), UltraMed, COD (Clinical Observation Data), and Asan Medical Center disease dictionary.',
        'medllm.feat2': 'Data Quality Control: Implemented rigorous filtering and validation processes to ensure medical accuracy and remove potentially harmful content.',
        'medllm.feat3': 'Fine-tuning Pipeline: Developed efficient training pipeline using HuggingFace Transformers with LoRA and QLoRA for parameter-efficient fine-tuning.',
        'medllm.feat4': 'Evaluation Framework: Created comprehensive evaluation suite covering multiple medical domains including clinical knowledge, diagnostics, and treatment recommendations.',
        'medllm.chal1': 'Data Scarcity: Limited Korean medical training data available. Solved by crawling disease dictionaries, translating English medical datasets, and augmenting existing Korean sources.',
        'medllm.chal2': 'Domain Adaptation: General-purpose LLMs struggled with medical terminology. Applied continued pre-training on medical corpus before task-specific fine-tuning.',
        'medllm.chal3': 'Ethical Considerations: Medical responses require careful handling of safety-critical information. Implemented response filtering and added appropriate disclaimers for medical advice.',
        'medllm.chal4': 'Evaluation Consistency: Medical QA evaluation needed domain expertise. Used KorMedMCQA benchmark with standardized scoring methodology for reliable comparison.',
        'medllm.result1': 'Benchmark Performance: Achieved significant improvement over baseline on KorMedMCQA benchmark, demonstrating effective domain adaptation.',
        'medllm.result2': 'Published Model: Released fine-tuned model on HuggingFace for community use and further research.',
        'medllm.result3': 'Research Contribution: Contributed to the KorMedMCQA paper accepted for publication, advancing Korean medical NLP research.',
        'medllm.result4': 'Key Learning: Gained expertise in domain-specific LLM fine-tuning, medical NLP challenges, and the importance of responsible AI development in healthcare applications.',

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
        'bilingual.overview': 'Developed a bidirectional translation model between Jeju dialect and standard Korean, addressing the challenge of preserving endangered regional languages through AI technology.',
        'bilingual.problem': 'Problem: Jeju dialect is classified as a critically endangered language by UNESCO. Younger generations have difficulty understanding traditional Jeju speech.',
        'bilingual.goal1': 'Goal 1: Build an accurate bidirectional translation system between Jeju dialect and standard Korean.',
        'bilingual.goal2': 'Goal 2: Compare different fine-tuning methods (Full, LoRA, QLoRA) for encoder-decoder translation models.',
        'bilingual.goal3': 'Goal 3: Create reusable datasets and models to support Korean dialect preservation efforts.',
        'bilingual.feat1': 'Dataset Preparation: Processed AIhub "Korean Dialect Utterances (Jeju)" dataset, creating parallel corpus suitable for seq2seq training.',
        'bilingual.feat2': 'Multi-Model Comparison: Evaluated both KoT5 and KoBART architectures for translation quality.',
        'bilingual.feat3': 'Parameter-Efficient Fine-tuning: Implemented LoRA and QLoRA (4-bit) to enable training on resource-constrained environments.',
        'bilingual.feat4': 'Comprehensive Evaluation: Established evaluation pipeline using BLEU and ROUGE scores for systematic comparison.',
        'bilingual.feat5': 'Public Release: Published processed dataset on HuggingFace for community use.',
        'bilingual.chal1': 'Low-Resource Language: Limited training data for Jeju dialect. Applied data augmentation and transfer learning.',
        'bilingual.chal2': 'Dialect Variability: Jeju dialect has significant regional variations. Focused on common patterns while preserving diversity.',
        'bilingual.chal3': 'Encoder-Decoder Complexity: Seq2seq models required careful hyperparameter tuning with Seq2SeqTrainer.',
        'bilingual.chal4': 'Quantization Trade-offs: 4-bit QLoRA showed some quality degradation. Documented trade-offs for practical deployment.',
        'bilingual.result1': 'Translation Quality: Achieved competitive BLEU scores demonstrating effective dialect translation.',
        'bilingual.result2': 'Efficiency Analysis: LoRA achieved near full fine-tuning quality with 90% fewer trainable parameters.',
        'bilingual.result3': 'Cultural Impact: Created tools that can help bridge generational language gaps and support preservation efforts.',
        'bilingual.result4': 'Key Learning: Gained practical experience in low-resource NLP and endangered language preservation.',

        // tiny-DDPM
        'ddpm.overview': 'A from-scratch implementation of Denoising Diffusion Probabilistic Models (DDPM) designed for deep understanding of diffusion model mathematics and architecture.',
        'ddpm.problem': 'Problem: Many diffusion model implementations are either too complex or too simplified. Need for educational yet production-quality codebase.',
        'ddpm.goal1': 'Goal 1: Implement DDPM from scratch following the original paper to deeply understand forward/reverse diffusion.',
        'ddpm.goal2': 'Goal 2: Extend to advanced techniques including DDIM for faster sampling and Classifier-Free Guidance.',
        'ddpm.goal3': 'Goal 3: Create maintainable, testable code as foundation for diffusion model research.',
        'ddpm.feat1': 'Multiple Model Architectures: Implemented both traditional UNet and modern Diffusion Transformer (DiT).',
        'ddpm.feat2': 'Config-Based Management: All hyperparameters managed via YAML config files for reproducible experiments.',
        'ddpm.feat3': 'Advanced Sampling: DDIM implementation for 10-50x faster sampling plus CFG for controllable generation.',
        'ddpm.feat4': 'Apple Silicon Support: Automatic MPS detection for GPU acceleration on Apple M-series chips.',
        'ddpm.feat5': 'Comprehensive Testing: Unit tests via pytest ensuring correctness of noise scheduling and model outputs.',
        'ddpm.chal1': 'Variance Scheduling: Understanding beta schedules and generation quality. Implemented multiple schedules with ablation studies.',
        'ddpm.chal2': 'Timestep Embedding: Proper sinusoidal embedding implementation was crucial for model performance.',
        'ddpm.chal3': 'Memory Efficiency: Long diffusion chains caused memory issues. Implemented gradient checkpointing.',
        'ddpm.chal4': 'DiT Integration: Adapting transformer architecture for image generation required careful patch embedding design.',
        'ddpm.result1': 'Successful Generation: Trained models successfully generate diverse, high-quality MNIST digits.',
        'ddpm.result2': 'Sampling Speed: DDIM achieves comparable quality with 10x fewer steps.',
        'ddpm.result3': 'Educational Value: The codebase serves as a comprehensive learning resource with detailed comments.',
        'ddpm.result4': 'Key Learning: Gained deep understanding of score-based generative models and noise prediction networks.',

        // tiny-stable-diffusion
        'sd.overview': 'A lightweight, educational implementation of Stable Diffusion 3 (SD3) built from scratch in PyTorch.',
        'sd.problem': 'Problem: State-of-the-art Stable Diffusion models are too large to train on consumer hardware.',
        'sd.goal1': 'Goal 1: Create a scaled-down SD3 implementation trainable on a single consumer GPU.',
        'sd.goal2': 'Goal 2: Implement the complete pipeline including VAE, text encoders (CLIP, T5), and MMDiT from scratch.',
        'sd.goal3': 'Goal 3: Extend to video/GIF generation using motion modules to demonstrate temporal consistency.',
        'sd.feat1': 'MMDiT Architecture: Implemented Multi-Modal Diffusion Transformer with bidirectional attention.',
        'sd.feat2': 'Rectified Flow: Used modern flow-based formulation for straighter sampling trajectories.',
        'sd.feat3': 'Complete Pipeline: Built VAE encoder/decoder, CLIP and T5 text conditioning, and full denoising pipeline.',
        'sd.feat4': 'Motion Module: Added temporal attention layers for generating animated GIFs with consistent motion.',
        'sd.feat5': 'Educational Design: Clean, well-commented codebase with step-by-step explanations.',
        'sd.chal1': 'Memory Constraints: Reduced model size while preserving architectural innovations through ablation studies.',
        'sd.chal2': 'VAE Training Stability: Implemented KL annealing and perceptual loss balancing for stable training.',
        'sd.chal3': 'Text-Image Alignment: Used classifier-free guidance and improved cross-attention mechanisms.',
        'sd.chal4': 'Motion Consistency: Added temporal attention layers and trained on video datasets for smooth transitions.',
        'sd.result1': 'Successful Generation: Model generates coherent images from text prompts at 64×64 resolution.',
        'sd.result2': 'Training Efficiency: Entire model trainable on single RTX 3090 in reasonable time.',
        'sd.result3': 'Educational Impact: Codebase serves as reference for learning modern diffusion architectures.',
        'sd.result4': 'Key Learning: Gained comprehensive understanding of SD3 architecture and rectified flow theory.',

        // Drama Analysis Pipeline
        'drama.overview': 'Developed during internship at CJ AI Center, this project creates a sophisticated Multi-Agentic pipeline for analyzing Korean drama scripts using LangChain.',
        'drama.problem': 'Problem: Analyzing drama scripts manually is time-consuming and subjective. Content teams need automated methods.',
        'drama.goal1': 'Goal 1: Build an automated pipeline for extracting structured information about characters, plot, and themes.',
        'drama.goal2': 'Goal 2: Implement multi-agent architecture with specialized agents for different analysis aspects.',
        'drama.goal3': 'Goal 3: Create a scalable system for batch processing scripts for content library analysis.',
        'drama.feat1': 'Multi-Agent Architecture: Designed specialized agents for character, plot, emotion, and relationship analysis.',
        'drama.feat2': 'LangChain Integration: Built robust agent orchestration with custom tools and memory management.',
        'drama.feat3': 'Korean NLP Processing: Implemented Korean-specific text processing including dialogue extraction and speaker identification.',
        'drama.feat4': 'Structured Output: Generated JSON-formatted analysis results compatible with downstream systems.',
        'drama.feat5': 'Batch Processing: Designed pipeline for processing multiple scripts with progress tracking.',
        'drama.chal1': 'Script Format Variability: Developed robust parsers with regex patterns and heuristics.',
        'drama.chal2': 'Agent Coordination: Implemented shared memory system and message passing protocols.',
        'drama.chal3': 'Context Length Limits: Created sliding window approach with intelligent chunking at scene boundaries.',
        'drama.chal4': 'Consistency in Analysis: Implemented entity resolution and character tracking across scripts.',
        'drama.result1': 'Automation Achievement: Reduced script analysis time from hours to minutes of automated processing.',
        'drama.result2': 'Analysis Quality: Produced valuable structured insights for content strategy understanding.',
        'drama.result3': 'Internship Contribution: Delivered working prototype demonstrating LLM applications in entertainment.',
        'drama.result4': 'Key Learning: Gained experience in production agentic AI systems and enterprise LLM deployment.',

        // tiny-chatbot-agents
        'chatbot.overview': 'A sophisticated enterprise-grade RAG chatbot system featuring dual-stage retrieval, hybrid search, and hallucination verification.',
        'chatbot.problem': 'Problem: Enterprise chatbots suffer from hallucinations and lack secure internal knowledge base usage.',
        'chatbot.goal1': 'Goal 1: Build a fully local RAG system for company-specific QnA and ToS documents.',
        'chatbot.goal2': 'Goal 2: Implement dual-stage retrieval prioritizing curated answers before complex document search.',
        'chatbot.goal3': 'Goal 3: Add hallucination verification to ensure grounded answers.',
        'chatbot.feat1': 'Dual-Stage RAG Pipeline: First searches QnA database, then falls back to ToS document search.',
        'chatbot.feat2': 'Hybrid Search: Combines vector search (E5), rule-based matching, and knowledge graph triplets.',
        'chatbot.feat3': 'Advanced Ranking: Two-stage ranking using Bi-Encoder (E5) and Cross-Encoder (BGE-Reranker).',
        'chatbot.feat4': 'Hallucination Verification: LLM-based verification step checking answer grounding.',
        'chatbot.feat5': 'MCP Server Support: Model Context Protocol integration for Claude Desktop compatibility.',
        'chatbot.feat6': 'Local LLM Ready: Works seamlessly with vLLM and Ollama via OpenAI-compatible APIs.',
        'chatbot.chal1': 'Retrieval Quality: Implemented hybrid approach combining dense, sparse, and graph retrieval.',
        'chatbot.chal2': 'Hallucination Detection: Added verification agent cross-referencing answers with source documents.',
        'chatbot.chal3': 'Unknown Answer Handling: Implemented confidence scoring and explicit "I don\'t know" responses.',
        'chatbot.chal4': 'Latency Optimization: Caching, parallel retrieval, and early termination for high-confidence matches.',
        'chatbot.result1': 'Improved Accuracy: Dual-stage retrieval significantly improved answer relevance.',
        'chatbot.result2': 'Reduced Hallucinations: Verification catches ~85% of hallucinated responses.',
        'chatbot.result3': 'Security Compliance: Fully local deployment meets enterprise security requirements.',
        'chatbot.result4': 'Key Learning: Deep expertise in production RAG systems and hallucination prevention.',

        // tiny-graph-rag
        'graphrag.overview': 'A lightweight implementation of Graph RAG combining Neo4j knowledge graphs with vector search for enhanced retrieval.',
        'graphrag.problem': 'Problem: Traditional RAG struggles when connected information is spread across different document chunks.',
        'graphrag.goal1': 'Goal 1: Build a hybrid retrieval system leveraging both structured relationships and unstructured text.',
        'graphrag.goal2': 'Goal 2: Implement automatic knowledge graph construction from documents without manual ontology creation.',
        'graphrag.goal3': 'Goal 3: Improve retrieval quality for multi-hop reasoning queries compared to pure vector search.',
        'graphrag.feat1': 'Automatic Graph Construction: LLM-based entity and relation extraction to convert documents to knowledge graphs.',
        'graphrag.feat2': 'Neo4j Integration: Leverages Neo4j graph database for efficient graph queries and Cypher support.',
        'graphrag.feat3': 'Hybrid Retrieval: Combines graph traversal with vector similarity search for comprehensive retrieval.',
        'graphrag.feat4': 'Multi-hop Reasoning: Supports complex queries requiring traversal of multiple relationships.',
        'graphrag.chal1': 'Entity Resolution: Implemented normalization and clustering-based entity resolution.',
        'graphrag.chal2': 'Relation Extraction Quality: Added filtering and validation steps to improve graph quality.',
        'graphrag.chal3': 'Query Complexity: Implemented adaptive routing based on query type for graph/vector balance.',
        'graphrag.chal4': 'Scalability: Optimized performance with indexing and caching strategies.',
        'graphrag.result1': 'Retrieval Improvement: Graph-based retrieval significantly improved answer quality for multi-hop queries.',
        'graphrag.result2': 'Knowledge Discovery: Graph visualization enables discovering hidden connections between documents.',
        'graphrag.result3': 'Educational Value: Implementation serves as learning reference for Graph RAG concepts.',
        'graphrag.result4': 'Key Learning: Gained expertise in knowledge graph construction and hybrid search architectures.',

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
        'ocr.overview': 'A synthetic data generator that creates natural and diverse images for OCR model training.',
        'ocr.problem': 'Problem: OCR training requires large amounts of labeled text images, but real data collection is expensive.',
        'ocr.goal1': 'Goal 1: Develop a synthetic text image generator realistic enough for OCR training.',
        'ocr.goal2': 'Goal 2: Apply diverse fonts, backgrounds, and noise to simulate real-world variability.',
        'ocr.goal3': 'Goal 3: Build an efficient pipeline for generating large quantities of synthetic images.',
        'ocr.feat1': 'Font Diversity: Supports various Korean and English fonts for diverse document styles.',
        'ocr.feat2': 'Background Diversity: Applies solid colors, textures, and gradients.',
        'ocr.feat3': 'Noise Simulation: Simulates camera noise, blur, and distortion.',
        'ocr.feat4': 'Auto Labeling: Automatically generates accurate text labels for generated images.',
        'ocr.chal1': 'Realism: Synthetic images must be realistic enough. Combined various noise and distortion effects.',
        'ocr.chal2': 'Font Rendering: Supporting diverse Korean font styles. Explored multiple font libraries and rendering options.',
        'ocr.chal3': 'Data Diversity: Generated data must cover real-world variability. Used parameter randomization.',
        'ocr.chal4': 'Generation Efficiency: Performance optimization for large-scale generation. Applied batch processing and parallelization.',
        'ocr.result1': 'OCR Improvement: Models trained with synthetic data outperformed real-data-only models.',
        'ocr.result2': 'Data Efficiency: Generated large training data without labeling costs.',
        'ocr.result3': 'Customization: Enabled domain-specific data generation (receipts, documents, etc.).',
        'ocr.result4': 'Key Learning: Gained expertise in synthetic data generation, image processing, and OCR model training.',

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
        'embedded.overview': 'Worked as a research intern at Ulsan University Embedded AI Lab. Participated in Korean medical domain LLM research.',
        'embedded.contrib1': 'Built Korean medical datasets from various sources including KorMedMCQA, MedExpQA, and Asan Medical Center disease dictionary',
        'embedded.contrib2': 'Performed fine-tuning of ko-gemma-2-9b-it model using LoRA/QLoRA',
        'embedded.contrib3': 'Contributed to KorMedMCQA benchmark paper accepted for publication',
        'embedded.contrib4': 'Developed evaluation framework ensuring accuracy and ethical soundness of medical responses',

        // Troja
        'troja.overview': 'Worked as a full-stack developer at Troja startup. Developed Django-based web platform for vehicle reservation and management.',
        'troja.contrib1': 'Designed and implemented Django full-stack web application',
        'troja.contrib2': 'Developed vehicle reservation and management system',
        'troja.contrib3': 'Built user authentication and authorization management system',
        'troja.contrib4': 'Implemented payment integration and real-time notification features',

        // Rubisco
        'rubisco.overview': 'Worked as an ML intern at Rubisco startup. Participated in deep learning model development for satellite image analysis.',
        'rubisco.contrib1': 'Developed deep learning models for satellite image segmentation',
        'rubisco.contrib2': 'Built data augmentation and preprocessing pipeline',
        'rubisco.contrib3': 'Optimized model performance and improved inference speed',
        'rubisco.contrib4': 'Researched object detection algorithms for satellite imagery',

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
