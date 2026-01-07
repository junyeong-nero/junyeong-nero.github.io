let currentQuestion = null;
let score = 0;
let totalAnswered = 0;
let wrongAnswers = [];
let confusingWords = [];
let isReviewMode = false;
let reviewIndex = 0;
let answered = false;
let currentStreak = 0;
let bestStreak = 0;
let currentMode = null;
let lastWrongCount = 0;

const STORAGE_KEY = 'toeicQuizState';

function saveState() {
    const state = {
        score,
        totalAnswered,
        wrongAnswers,
        confusingWords,
        currentStreak,
        bestStreak,
        savedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const state = JSON.parse(saved);
            score = state.score || 0;
            totalAnswered = state.totalAnswered || 0;
            wrongAnswers = state.wrongAnswers || [];
            confusingWords = state.confusingWords || [];
            currentStreak = state.currentStreak || 0;
            bestStreak = state.bestStreak || 0;
            lastWrongCount = wrongAnswers.length;
            return true;
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }
    return false;
}

function clearState() {
    localStorage.removeItem(STORAGE_KEY);
}

function init() {
    loadState();

    updateBadge();
    updateConfusingBadge();

    // Wait for vocabulary to load
    if (toeicVocabulary.length === 0) {
        const checkVocab = setInterval(() => {
            if (toeicVocabulary.length > 0) {
                clearInterval(checkVocab);
                displayQuestion();
            }
        }, 100);
        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkVocab);
            if (toeicVocabulary.length === 0) {
                console.error('Vocabulary failed to load');
            } else {
                displayQuestion();
            }
        }, 5000);
    } else {
        displayQuestion();
    }
}

function displayQuestion() {
    answered = false;

    const question = getRandomQuestion();
    currentQuestion = question;

    currentMode = Math.random() < 0.5 ? 'en-to-ko' : 'ko-to-en';

    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options');
    const feedback = document.getElementById('feedback');

    feedback.classList.add('hidden');

    if (currentMode === 'en-to-ko') {
        questionText.textContent = question.en;
        displayOptions(question, 'ko');
    } else {
        const randomMeaning = question.ko[Math.floor(Math.random() * question.ko.length)];
        questionText.textContent = randomMeaning;
        displayOptions(question, 'en');
    }
}

function getRandomQuestion() {
    const randomIndex = Math.floor(Math.random() * toeicVocabulary.length);
    return toeicVocabulary[randomIndex];
}

function getAllMeanings(koArray) {
    return koArray.join(', ');
}

function displayOptions(correctQuestion, displayLang) {
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    const correctAnswer = displayLang === 'ko' ? getAllMeanings(correctQuestion.ko) : correctQuestion.en;
    const correctItemEn = correctQuestion.en;

    const wrongOptions = toeicVocabulary
        .filter(item => item.en !== correctItemEn)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)
        .map(item => ({
            text: displayLang === 'ko' ? getAllMeanings(item.ko) : item.en,
            en: item.en,
            ko: item.ko
        }));

    const allOptions = [...wrongOptions, {
        text: correctAnswer,
        en: correctQuestion.en,
        ko: correctQuestion.ko,
        isCorrect: true
    }].sort(() => Math.random() - 0.5);

    allOptions.forEach((option, index) => {
        const optionWrapper = document.createElement('div');
        optionWrapper.className = 'option-wrapper';

        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option.text;

        const isConfusing = confusingWords.some(w => w.en === option.en);
        if (isConfusing) {
            button.classList.add('confusing');
        }

        button.onclick = (e) => {
            if (e.target.classList.contains('add-confusing-btn')) return;
            checkAnswer(option.text, correctAnswer, button, option);
        };

        const addBtn = document.createElement('button');
        addBtn.className = 'add-confusing-btn';
        addBtn.innerHTML = isConfusing ? '−' : '+';
        addBtn.title = isConfusing ? '헷갈리는 단어에서 제거' : '헷갈리는 단어로 추가';
        addBtn.onclick = () => toggleConfusingWord(option.en, option.ko, option.text, addBtn);

        optionWrapper.appendChild(button);
        optionWrapper.appendChild(addBtn);
        optionsContainer.appendChild(optionWrapper);
    });
}

function toggleConfusingWord(en, ko, displayText, button) {
    const existingIndex = confusingWords.findIndex(w => w.en === en);

    if (existingIndex >= 0) {
        confusingWords.splice(existingIndex, 1);
        button.innerHTML = '+';
        button.title = '헷갈리는 단어로 추가';

        const optionBtn = button.previousElementSibling;
        if (optionBtn) {
            optionBtn.classList.remove('confusing');
        }

        showToast('단어가 목록에서 제거되었습니다.');
    } else {
        confusingWords.push({ en, ko });
        button.innerHTML = '−';
        button.title = '헷갈리는 단어에서 제거';

        const optionBtn = button.previousElementSibling;
        if (optionBtn) {
            optionBtn.classList.add('confusing');
        }

        showToast('단어가 헷갈리는 목록에 추가되었습니다.');
    }

    saveState();
    updateConfusingBadge();
}

function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function updateConfusingBadge() {
    const badges = document.querySelectorAll('.confusing-badge');
    badges.forEach(badge => {
        const count = confusingWords.length;
        badge.textContent = count > 99 ? '99+' : (count > 0 ? count : '');
        if (count > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    });
}

function resetStats() {
    if (confirm('정말로 통계를 초기화하시겠습니까?')) {
        score = 0;
        totalAnswered = 0;
        currentStreak = 0;
        bestStreak = 0;
        wrongAnswers = [];
        confusingWords = [];
        clearState();
        closeStatsModal();
        updateBadge();
        updateConfusingBadge();
        displayQuestion();
    }
}

function checkAnswer(selected, correct, button, correctQuestion) {
    if (answered) return;
    answered = true;
    
    const buttons = document.querySelectorAll('.option-btn');
    const feedback = document.getElementById('feedback');
    
    buttons.forEach(btn => {
        btn.classList.add('disabled');
        if (btn.textContent === correct) {
            btn.classList.add('correct');
        }
    });
    
    totalAnswered++;
    
    if (selected === correct) {
        score++;
        currentStreak++;
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
        }
        feedback.textContent = '정답입니다!';
        feedback.className = 'feedback correct';
    } else {
        button.classList.add('incorrect');
        currentStreak = 0;
        feedback.textContent = '정답: ' + correct;
        feedback.className = 'feedback incorrect';
        
        const existingWrong = wrongAnswers.find(w => w.en === correctQuestion.en);
        if (!existingWrong) {
            wrongAnswers.push({
                en: correctQuestion.en,
                ko: correctQuestion.ko
            });
            
            lastWrongCount = wrongAnswers.length;
            updateBadge();
        }
    }
    
    feedback.classList.remove('hidden');
    
    saveState();
    
    setTimeout(() => {
        displayQuestion();
    }, 1200);
}

function updateBadge() {
    const badge = document.getElementById('wrong-badge');
    const count = wrongAnswers.length;
    
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function startReview() {
    if (wrongAnswers.length === 0) return;
    
    reviewIndex = 0;
    isReviewMode = true;
    
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');
    
    displayReviewQuestion();
}

function displayReviewQuestion() {
    if (reviewIndex >= wrongAnswers.length) {
        finishReview();
        return;
    }

    const wrong = wrongAnswers[reviewIndex];
    const questionText = document.getElementById('review-question-text');
    const optionsContainer = document.getElementById('review-options');
    const answerBox = document.getElementById('review-answer');

    optionsContainer.innerHTML = '';
    answerBox.classList.add('hidden');

    questionText.textContent = wrong.en;

    const correctAnswer = getAllMeanings(wrong.ko);
    const wrongOptions = toeicVocabulary
        .filter(item => item.en !== wrong.en)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)
        .map(item => getAllMeanings(item.ko));

    const allOptions = [...wrongOptions, correctAnswer].sort(() => Math.random() - 0.5);

    allOptions.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => showReviewAnswer(option, correctAnswer, button);
        optionsContainer.appendChild(button);
    });

    document.getElementById('review-progress').textContent =
        `${reviewIndex + 1} / ${wrongAnswers.length}`;
}

function showReviewAnswer(selected, correct, button) {
    const buttons = document.querySelectorAll('#review-options .option-btn');
    const answerBox = document.getElementById('review-answer');
    const answerText = document.getElementById('review-answer-text');
    const nextBtn = document.getElementById('review-next-btn');
    
    buttons.forEach(btn => {
        btn.classList.add('disabled');
        if (btn.textContent === correct) {
            btn.classList.add('correct');
        }
    });
    
    if (selected === correct) {
        answerText.innerHTML = `<span style="color: #2e7d32;">정답입니다!</span><br>정답: ${correct}`;
    } else {
        answerText.innerHTML = `<span style="color: #c62828;">오답입니다.</span><br>정답: ${correct}`;
    }
    
    answerBox.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
}

function nextReviewQuestion() {
    reviewIndex++;
    displayReviewQuestion();
}

function finishReview() {
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    wrongAnswers = [];
    reviewIndex = 0;
    isReviewMode = false;
    
    saveState();
    updateBadge();
    displayQuestion();
}

function openStatsModal() {
    const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    
    document.getElementById('stat-total').textContent = totalAnswered;
    document.getElementById('stat-correct').textContent = score;
    document.getElementById('stat-accuracy').textContent = accuracy + '%';
    document.getElementById('stat-streak').textContent = currentStreak;
    document.getElementById('stat-best-streak').textContent = bestStreak;
    document.getElementById('stat-wrong').textContent = wrongAnswers.length;
    
    document.getElementById('stats-modal').classList.remove('hidden');
}

function closeStatsModal() {
    document.getElementById('stats-modal').classList.add('hidden');
}

function resetStats() {
    if (confirm('정말로 통계를 초기화하시겠습니까?')) {
        score = 0;
        totalAnswered = 0;
        currentStreak = 0;
        bestStreak = 0;
        wrongAnswers = [];
        clearState();
        closeStatsModal();
        updateBadge();
        displayQuestion();
    }
}

function openWrongList() {
    const listContainer = document.getElementById('wrong-list');

    if (wrongAnswers.length === 0) {
        listContainer.innerHTML = '<div class="wrong-empty">틀린 단어가 없습니다.</div>';
    } else {
        listContainer.innerHTML = wrongAnswers.map(item => `
            <div class="wrong-item">
                <span class="wrong-en">${item.en}</span>
                <span class="wrong-ko">${item.ko.join(', ')}</span>
            </div>
        `).join('');
    }
    
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('wrong-list-screen').classList.remove('hidden');
}

function closeWrongList() {
    document.getElementById('wrong-list-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
}

function openConfusingList() {
    const listContainer = document.getElementById('confusing-list');

    if (confusingWords.length === 0) {
        listContainer.innerHTML = '<div class="wrong-empty">헷갈리는 단어가 없습니다.<br><small>+ 버튼을 눌러 단어를 추가하세요</small></div>';
    } else {
        listContainer.innerHTML = confusingWords.map((item, index) => `
            <div class="wrong-item">
                <div class="wrong-item-content">
                    <span class="wrong-en">${item.en}</span>
                    <span class="wrong-ko">${item.ko.join(', ')}</span>
                </div>
                <button class="remove-confusing-btn" onclick="removeConfusingWord(${index})">×</button>
            </div>
        `).join('');
    }

    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('confusing-list-screen').classList.remove('hidden');
}

function closeConfusingList() {
    document.getElementById('confusing-list-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
}

function removeConfusingWord(index) {
    confusingWords.splice(index, 1);
    saveState();
    updateConfusingBadge();
    openConfusingList();
    showToast('단어가 목록에서 제거되었습니다.');
}

function handleKeydown(e) {
    if (answered) return;

    const key = e.key;
    if (key >= '1' && key <= '5') {
        const index = parseInt(key) - 1;
        const buttons = document.querySelectorAll('.option-btn');
        if (buttons[index]) {
            buttons[index].click();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', handleKeydown);
    init();
});
