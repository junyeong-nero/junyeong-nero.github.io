const STORAGE_KEY = "resume_word_counter_v1";
const STOP_WORDS = new Set([
    "그리고", "그러나", "또한", "정말", "매우", "통해", "대한", "위해", "에서",
    "으로", "에게", "하는", "입니다", "있습니다", "있었고", "있었습니", "저는",
    "제가", "저의", "그", "이", "저", "수", "것", "더", "잘", "때", "및",
    "한", "등", "좀", "가장", "하도록", "하며", "했다", "했다는", "했던"
]);

const essayInput = document.getElementById("essayInput");
const maxCharsInput = document.getElementById("maxChars");
const countWithSpaces = document.getElementById("countWithSpaces");
const countWithoutSpaces = document.getElementById("countWithoutSpaces");
const byteCount = document.getElementById("byteCount");
const sentenceCount = document.getElementById("sentenceCount");
const avgSentenceLength = document.getElementById("avgSentenceLength");
const paragraphCount = document.getElementById("paragraphCount");
const progressLabel = document.getElementById("progressLabel");
const progressBar = document.getElementById("progressBar");
const progressCard = document.getElementById("progressCard");
const limitFeedback = document.getElementById("limitFeedback");
const repeatedWords = document.getElementById("repeatedWords");
const quickChecks = document.getElementById("quickChecks");
const saveStatus = document.getElementById("saveStatus");
const normalizeBtn = document.getElementById("normalizeBtn");
const clearBtn = document.getElementById("clearBtn");
const presetButtons = Array.from(document.querySelectorAll(".preset-btn"));

let saveTimer = null;

function loadSavedState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return;
        }

        const parsed = JSON.parse(raw);
        essayInput.value = typeof parsed.text === "string" ? parsed.text : "";

        if (Number.isFinite(parsed.maxChars) && parsed.maxChars >= 0) {
            maxCharsInput.value = String(parsed.maxChars);
        }
    } catch (error) {
        console.error("Failed to load saved state", error);
    }
}

function scheduleSave() {
    saveStatus.textContent = "자동 저장 준비 중";
    saveStatus.classList.add("pending");

    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
        persistState();
    }, 250);
}

function persistState() {
    try {
        const payload = {
            text: essayInput.value,
            maxChars: sanitizeLimit(maxCharsInput.value)
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        saveStatus.textContent = "자동 저장됨";
        saveStatus.classList.remove("pending");
    } catch (error) {
        console.error("Failed to save state", error);
        saveStatus.textContent = "저장 실패";
        saveStatus.classList.remove("pending");
    }
}

function sanitizeLimit(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }
    return parsed;
}

function countUtf8Bytes(text) {
    return new TextEncoder().encode(text).length;
}

function getParagraphs(text) {
    return text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

function getSentences(text) {
    return text
        .split(/[.!?]+|[。！？]+|\n+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);
}

function formatNumber(value) {
    return new Intl.NumberFormat("ko-KR").format(value);
}

function extractTopRepeatedWords(text) {
    const normalized = text
        .toLowerCase()
        .replace(/[^0-9a-zA-Z가-힣\s]/g, " ");

    const counts = new Map();

    normalized
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
        .filter((token) => !STOP_WORDS.has(token))
        .forEach((token) => {
            counts.set(token, (counts.get(token) || 0) + 1);
        });

    return Array.from(counts.entries())
        .filter(([, count]) => count >= 2)
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "ko"))
        .slice(0, 5);
}

function updatePresetButtons(limit) {
    presetButtons.forEach((button) => {
        const isActive = Number.parseInt(button.dataset.limit, 10) === limit;
        button.classList.toggle("active", isActive);
    });
}

function renderRepeatedWords(items) {
    if (!items.length) {
        repeatedWords.className = "token-list empty";
        repeatedWords.textContent = "반복 단어가 여기에 표시됩니다.";
        return;
    }

    repeatedWords.className = "token-list";
    repeatedWords.innerHTML = items
        .map(([word, count]) => `<span class="token-chip"><span>${escapeHtml(word)}</span><strong>${count}회</strong></span>`)
        .join("");
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function buildQuickChecks({ text, withSpaces, sentences, paragraphs, repeated, limit }) {
    const checks = [];

    if (!text.trim()) {
        checks.push("아직 입력된 내용이 없습니다. 초안 문장을 붙여넣으면 바로 분석됩니다.");
        return checks;
    }

    if (withSpaces > limit && limit > 0) {
        checks.push(`제한 글자수를 ${formatNumber(withSpaces - limit)}자 초과했습니다. 압축이 필요한 상태입니다.`);
    } else if (limit > 0 && withSpaces >= Math.floor(limit * 0.9)) {
        checks.push("제한치에 거의 도달했습니다. 마지막 문단은 더 짧고 선명하게 다듬는 편이 안전합니다.");
    } else {
        checks.push("현재 길이는 제한 안에 있습니다. 핵심 표현을 유지하면서 문장을 다듬기 좋은 상태입니다.");
    }

    if (sentences.length >= 1) {
        const longestSentence = Math.max(...sentences.map((sentence) => sentence.replace(/\s/g, "").length));
        if (longestSentence >= 120) {
            checks.push("가장 긴 문장이 많이 길습니다. 한 문장을 둘로 나누면 읽기 부담이 줄어듭니다.");
        } else if (longestSentence <= 25 && sentences.length >= 3) {
            checks.push("문장들이 전반적으로 짧습니다. 성과와 맥락을 조금 더 구체화해도 됩니다.");
        } else {
            checks.push("문장 길이는 극단적으로 치우치지 않았습니다.");
        }
    }

    if (paragraphs.length >= 4) {
        checks.push("단락 수가 많습니다. 제출 폼이 좁다면 2~3개 단락으로 합치는 편이 안정적입니다.");
    } else if (paragraphs.length <= 1 && withSpaces >= 300) {
        checks.push("한 단락에 내용이 몰려 있습니다. 문단을 나누면 가독성이 좋아집니다.");
    }

    if (repeated.length > 0) {
        checks.push(`반복 표현이 보입니다. 특히 "${repeated[0][0]}" 같은 단어는 다른 표현으로 바꿔볼 가치가 있습니다.`);
    } else {
        checks.push("두드러지는 반복 단어는 많지 않습니다.");
    }

    return checks;
}

function updateProgress(withSpaces, limit) {
    const ratio = limit > 0 ? withSpaces / limit : 0;
    const percentage = limit > 0 ? Math.round(ratio * 100) : 0;
    const clampedPercentage = Math.min(percentage, 100);

    progressLabel.textContent = `${formatNumber(percentage)}%`;
    progressBar.style.width = `${clampedPercentage}%`;

    progressCard.classList.remove("warning", "danger");

    if (!essayInput.value.trim()) {
        limitFeedback.textContent = "아직 입력된 글이 없습니다.";
        return;
    }

    if (limit === 0) {
        limitFeedback.textContent = "최대 글자수가 0으로 설정되어 있습니다. 제한값을 지정하면 초과 여부를 바로 확인할 수 있습니다.";
        return;
    }

    if (ratio > 1) {
        progressCard.classList.add("danger");
        limitFeedback.textContent = `${formatNumber(withSpaces - limit)}자 초과했습니다. 반복 표현과 군더더기 문장을 먼저 줄여보세요.`;
        return;
    }

    if (ratio >= 0.8) {
        progressCard.classList.add("warning");
        limitFeedback.textContent = `${formatNumber(limit - withSpaces)}자 남았습니다. 마무리 문장은 더 압축적으로 쓰는 편이 좋습니다.`;
        return;
    }

    limitFeedback.textContent = `${formatNumber(limit - withSpaces)}자 여유가 있습니다. 성과나 수치를 더 보강할 수 있습니다.`;
}

function updateQuickChecks(items) {
    quickChecks.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function analyzeText() {
    const text = essayInput.value;
    const limit = sanitizeLimit(maxCharsInput.value);
    maxCharsInput.value = String(limit);

    const withSpaces = text.length;
    const withoutSpaces = text.replace(/\s/g, "").length;
    const bytes = countUtf8Bytes(text);
    const paragraphs = getParagraphs(text);
    const sentences = getSentences(text);
    const avgLength = sentences.length
        ? Math.round(
            sentences.reduce((total, sentence) => total + sentence.replace(/\s/g, "").length, 0) / sentences.length
        )
        : 0;
    const repeated = extractTopRepeatedWords(text);

    countWithSpaces.textContent = formatNumber(withSpaces);
    countWithoutSpaces.textContent = formatNumber(withoutSpaces);
    byteCount.textContent = formatNumber(bytes);
    sentenceCount.textContent = formatNumber(sentences.length);
    avgSentenceLength.textContent = formatNumber(avgLength);
    paragraphCount.textContent = formatNumber(paragraphs.length);

    updateProgress(withSpaces, limit);
    renderRepeatedWords(repeated);
    updateQuickChecks(
        buildQuickChecks({
            text,
            withSpaces,
            sentences,
            paragraphs,
            repeated,
            limit
        })
    );
    updatePresetButtons(limit);
}

function normalizeWhitespace() {
    const normalized = essayInput.value
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+\n/g, "\n")
        .trim();

    essayInput.value = normalized;
    analyzeText();
    scheduleSave();
}

function clearAll() {
    essayInput.value = "";
    maxCharsInput.value = "1000";
    analyzeText();
    persistState();
}

essayInput.addEventListener("input", () => {
    analyzeText();
    scheduleSave();
});

maxCharsInput.addEventListener("input", () => {
    analyzeText();
    scheduleSave();
});

normalizeBtn.addEventListener("click", normalizeWhitespace);
clearBtn.addEventListener("click", clearAll);

presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
        maxCharsInput.value = button.dataset.limit;
        analyzeText();
        scheduleSave();
    });
});

loadSavedState();
analyzeText();
