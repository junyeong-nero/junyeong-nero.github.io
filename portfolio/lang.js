// Language Toggle Script (Shared)
(function () {
    var translations = {
        ko: {
            // Section titles
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

            // Footer
            'footer.rights': '© 2026 송준영. All rights reserved.',

            // Vision
            'hero.vision': '<strong>비전:</strong> 세상에 대한 끝없는 호기심과 끊임없는 배움의 즐거움을 원동력으로, 금전적 이익보다 타인에 대한 의미 있는 기여로 정의되는 삶을 추구합니다.',

            // Navigation
            'nav.back': '← 포트폴리오로 돌아가기',

            // Document title
            'doc.title': '송준영 | 포트폴리오'
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
        'doc.title': 'Junyeong Song | Portfolio'
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
